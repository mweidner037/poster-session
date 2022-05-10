import express = require("express");
import path = require("path");
import { Server } from "http";
import https = require("https");
import fs = require("fs");
import WebSocket = require("ws");
import { PlayerState, RoomState, SerialRuntime } from "../common/state";
import { MyVector3, WebSocketMessage } from "../common/util";
import * as collabs from "@collabs/collabs";

const app = express();
const port = process.env.PORT || 3000;

const useHttps = process.argv[2] === "-s";
console.log(`useHttps: ${useHttps}`);

// Serve build/site under /.
app.use("/", express.static(path.join(__dirname, "../../site")));

let server: Server;
if (useHttps) {
  const key = fs.readFileSync(
    path.join(__dirname, "../../../keys/demo-key.pem")
  );
  const cert = fs.readFileSync(
    path.join(__dirname, "../../../keys/demo-cert.pem")
  );
  server = https
    .createServer({ key, cert }, app)
    .listen(port, () => console.log(`Listening at https://localhost:${port}/`));
} else {
  server = app.listen(port, () =>
    console.log(`Listening at http://localhost:${port}/`)
  );
}

// Server replica.
const serverReplica = new SerialRuntime({
  batchingStrategy: new collabs.RateLimitBatchingStrategy(100),
  replicaId: "server",
  isServer: true,
});
const roomState = serverReplica.registerCollab(
  "room",
  collabs.Pre(RoomState)()
);
const playersByID = new Map<string, PlayerState>();
roomState.players.on("Add", (e) => {
  playersByID.set(e.meta.sender, e.value);
});

serverReplica.load(collabs.Optional.empty());

// Construct initial state: a tiled ground.
roomState.furniture.add(
  "boring",
  MyVector3.new(0, 0, 0),
  MyVector3.new(0, 0, 0),
  true,
  "tiling.gltf"
);

serverReplica.on("Send", (e) => {
  broadcast(e.message);
});

function send(client: WebSocket, message: WebSocketMessage) {
  client.send(JSON.stringify(message));
}

// WebSocket server.
const clients = new Set<WebSocket.WebSocket>();
const clientIDs = new Map<WebSocket.WebSocket, string>();
function broadcast(msg: string) {
  const message: WebSocketMessage = { type: "msg", msg };
  for (const client of clients) {
    send(client, message);
  }
}

const wsServer = new WebSocket.Server({ server });
wsServer.on("connection", (ws) => {
  clients.add(ws);
  ws.on("close", () => {
    clients.delete(ws);
    const id = clientIDs.get(ws);
    if (id !== undefined) {
      clientIDs.delete(ws);
      const player = playersByID.get(id);
      if (player !== undefined) {
        // Delete the player from the state.
        playersByID.delete(id);
        roomState.players.delete(player);
      }
    }
  });

  ws.on("message", (data) => {
    const message = <WebSocketMessage>JSON.parse(data.toString());
    switch (message.type) {
      case "id":
        clientIDs.set(ws, message.replicaId);
        break;
      case "msg":
        // Deliver to server.
        serverReplica.receive(message.msg);

        // Broadcast to all clients (including sender).
        broadcast(message.msg);
        break;
      case "ping":
        // Okay.
        break;
    }
  });

  // Send initial state.
  const initialState = serverReplica.save();
  send(ws, { type: "load", saveData: collabs.bytesAsString(initialState) });
});

// Keep-alive for Heroku server.
setInterval(() => {
  for (const client of clients) {
    client.ping();
  }
}, 30000);

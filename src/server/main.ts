import express = require("express");
import path = require("path");
import https = require("https");
import fs = require("fs");
import WebSocket = require("ws");
import { PlayerState, SerialMutCSet, SerialRuntime } from "../common/state";
import { PlayerStateArgsSerializer } from "../common/util/serialization";
import { WebSocketMessage } from "../common/util/web_socket_message";
import * as collabs from "@collabs/collabs";

const app = express();
const port = process.env.PORT || 3000;

// Serve build/site under /.
app.use("/", express.static(path.join(__dirname, "../../site")));
const key = fs.readFileSync(path.join(__dirname, "../../../keys/demo-key.pem"));
const cert = fs.readFileSync(
  path.join(__dirname, "../../../keys/demo-cert.pem")
);
const server = https
  .createServer({ key, cert }, app)
  .listen(port, () => console.log(`Listening at https://localhost:${port}/`));

// Server replica.
const serverReplica = new SerialRuntime({
  batchingStrategy: new collabs.RateLimitBatchingStrategy(100),
  replicaId: "server",
});
const players = serverReplica.registerCollab(
  "players",
  collabs.Pre(SerialMutCSet)(
    collabs.ConstructorAsFunction(PlayerState),
    "local",
    new PlayerStateArgsSerializer()
  )
);
const playersByID = new Map<string, PlayerState>();
players.on("Add", (e) => {
  playersByID.set(e.meta.sender, e.value);
});

serverReplica.load(collabs.Optional.empty());

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
        players.delete(player);
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
    }
  });

  // Send initial state.
  const initialState = serverReplica.save();
  send(ws, { type: "load", saveData: collabs.bytesAsString(initialState) });
});

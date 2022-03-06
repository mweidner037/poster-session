import express = require("express");
import path = require("path");
import WebSocket = require("ws");
import { Entity, SerialMutCSet, SerialRuntime } from "../common/state";
import { PositionRotationSerializer } from "../common/util/serialization";
import * as collabs from "@collabs/collabs";

const app = express();
const port = process.env.PORT || 3000;

// Serve build/site under /.
app.use("/", express.static(path.join(__dirname, "../../site")));
const server = app.listen(port, () =>
  console.log(`Listening at http://localhost:${port}/`)
);

// Server replica.
const serverReplica = new SerialRuntime({
  batchingStrategy: new collabs.RateLimitBatchingStrategy(100),
  replicaId: "server",
});
const players = serverReplica.registerCollab(
  "players",
  collabs.Pre(SerialMutCSet)(
    collabs.ConstructorAsFunction(Entity),
    "local",
    new PositionRotationSerializer()
  )
);

serverReplica.load(collabs.Optional.empty());

serverReplica.on("Send", (e) => {
  broadcast(e.message);
});

// WebSocket server.
const clients = new Set<WebSocket.WebSocket>();
function broadcast(message: string) {
  for (const client of clients) {
    client.send(message);
  }
}

const wsServer = new WebSocket.Server({ server });
wsServer.on("connection", (ws) => {
  clients.add(ws);
  ws.on("close", () => {
    clients.delete(ws);
  });

  ws.on("message", (data) => {
    const message = data.toString();
    // Deliver to server.
    serverReplica.receive(message);

    // Broadcast to all clients (including sender).
    broadcast(message);
  });

  // Send initial state.
  const initialState = serverReplica.save();
  ws.send(collabs.bytesAsString(initialState));
});

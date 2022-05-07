import ReconnectingWebSocket from "reconnecting-websocket";
import * as collabs from "@collabs/collabs";
import { SerialRuntime } from "../common/state";
import { WebSocketMessage } from "../common/util";

/**
 * Connects the Collabs replica to the server running out of server/main.ts.
 */
export function connectToServer(replica: SerialRuntime): void {
  // TODO: reconnecting helps us on open, but there will still
  // be problems if the connection is closed (will miss messages).
  const ws = new ReconnectingWebSocket(location.origin.replace(/^http/, "ws"));
  function send(message: WebSocketMessage) {
    ws.send(JSON.stringify(message));
  }
  send({ type: "id", replicaId: replica.replicaID });
  replica.on("Send", (e) => {
    send({ type: "msg", msg: e.message });
  });

  ws.addEventListener("message", (e) => {
    const message = JSON.parse(e.data) as WebSocketMessage;
    if (message.type === "load") {
      if (replica.isLoaded) {
        // TODO: if this happens, it means our connection dropped
        // temporarily. Need to back-fill missed data.
        return;
      }
      replica.load(
        collabs.Optional.of(collabs.stringAsBytes(message.saveData))
      );
    } else if (message.type === "msg") {
      replica.receive(message.msg);
    }
  });
}

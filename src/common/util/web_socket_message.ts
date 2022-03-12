export interface LoadMessage {
  type: "load";
  saveData: string;
}

export interface CollabMessage {
  type: "msg";
  msg: string;
}

export interface ReplicaIDMessage {
  type: "id";
  replicaId: string;
}

export interface PingMessage {
  type: "ping";
}

export type WebSocketMessage =
  | LoadMessage
  | CollabMessage
  | ReplicaIDMessage
  | PingMessage;

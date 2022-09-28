import http from "http";
import { Server } from "socket.io";

let _io: Server | null = null;
export function init(server: http.Server, origin: string) {
  _io = new Server(server, {
    cors: {
      origin,
    },
  });
}

export function io(): Server {
  if (!_io) {
    throw new Error("socket.io not initialized");
  }
  return _io;
}

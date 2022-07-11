import { SERVER_URL } from "./requests";
import io from "socket.io-client";
import { useEffect, useState } from "react";

export const socket = io(SERVER_URL);

export function SocketTest() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastPong, setLastPong] = useState<string | null>(null);

  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("pong", () => {
      setLastPong(new Date().toISOString());
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("pong");
    };
  }, []);

  const sendPing = () => {
    socket.emit("ping");
  };

  return (
    <div className="socket-test">
      <h3>socket.io tests...</h3>
      <p>Connected: {"" + isConnected}</p>
      <p>{`Last pong: ${lastPong || "-"}`}</p>
      <button onClick={sendPing}>Send ping</button>
    </div>
  );
}

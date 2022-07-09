import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080",
  },
});

app.get("/", (_req, res) => {
  res.send("<h1>Hello world</h1>");
});

app.get("/games/:gameId", (_req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:8080"); // Why do I need to do this if I set cors above?
  res.send({
    variant: "baduk",
    moves: [{ 0: "aa" }, { 1: "bb" }, { 0: "cc" }],
    config: {},
  });
});

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("ping", function (data) {
    io.emit("pong", data);
    console.log("ping");
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});

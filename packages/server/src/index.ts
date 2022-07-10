import express from "express";
import http from "http";
import { Server } from "socket.io";
import { getGame, getGames, createGame, playMove } from "./games";
import bodyParser from "body-parser";
import cors from "cors";

const LOCAL_ORIGIN = "http://localhost:3000";

const app = express();
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use(cors({ origin: LOCAL_ORIGIN, credentials: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: LOCAL_ORIGIN,
  },
});

app.get("/", (_req, res) => {
  res.send("<h1>Hello world</h1>");
});

app.get("/games/:gameId", (req, res) => {
  res.send(getGame(Number(req.params.gameId)));
});

app.get("/games", (req, res) => {
  res.send(getGames(Number(req.query.page) || 0));
  return;
});

app.post("/games", (req, res) => {
  console.log("body", req.body);

  const data = req.body;

  res.send(createGame(data.variant, data.config));
  return;
});

app.post("/games/:gameId/move", (req, res) => {
  console.log("body", req.body);

  const move = req.body;

  res.send(playMove(Number(req.params.gameId), move));
  return;
});

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("ping", function (data) {
    io.emit("pong", data);
    console.log("ping");
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});

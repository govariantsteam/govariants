import express from "express";
import http from "http";
import { Server } from "socket.io";
import { getGame, getGames, createGame, playMove } from "./games";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";

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

// If production, serve the React repo!
const isProd = process.env.NODE_ENV === "production";
if (isProd) {
  // Compute the build path and index.html path
  const build_path = path.join(__dirname, "../../../packages/client/build");
  const indexHtml = path.join(build_path, "index.html");

  // Setup build path as a static assets path
  app.use(express.static(build_path));
  // Serve index.html on unmatched routes
  app.get("*", (_req, res) => res.sendFile(indexHtml));
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});

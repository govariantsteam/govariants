import express from "express";
import http from "http";
import { Server } from "socket.io";
import { getGame, getGames, createGame, playMove } from "./games";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { connectToDb } from "./db";
import { GameResponse, MovesType } from "@ogfcommunity/variants-shared";

const LOCAL_ORIGIN = "http://localhost:3000";

// initialize Express
const app = express();
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use(cors({ origin: LOCAL_ORIGIN, credentials: true }));

// initialize socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: LOCAL_ORIGIN,
  },
});

// Initialize MongoDB
connectToDb();

// Set up express routes
app.get("/games/:gameId", async (req, res) => {
  const game: GameResponse = await getGame(req.params.gameId);
  res.send(game);
});

app.get("/games", async (req, res) => {
  const games: GameResponse[] = await getGames(Number(req.query.page));
  res.send(games || 0);
});

app.post("/games", async (req, res) => {
  const data = req.body;

  const game: GameResponse = await createGame(data.variant, data.config);

  res.send(game);

  return;
});

app.post("/games/:gameId/move", async (req, res) => {
  console.log("body", req.body);

  const move: MovesType = req.body;

  const game: GameResponse = await playMove(req.params.gameId, move);

  res.send(game);
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

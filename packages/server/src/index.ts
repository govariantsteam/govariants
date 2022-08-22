import express from "express";
import http from "http";
import { Server } from "socket.io";
import {
  getGame,
  getGames,
  createGame,
  playMove,
  takeSeat,
  leaveSeat,
} from "./games";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { connectToDb } from "./db";
import {
  GameResponse,
  MovesType,
  DELETETHIS_getCurrentUser,
  User,
} from "@ogfcommunity/variants-shared";

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

app.post("/games/:gameId/move", async (req, res, next) => {
  const move: MovesType = req.body;
  // TODO: make sure this is set to a valid id once we have user auth
  // const user_id = req.user?.id; */
  const user: User = DELETETHIS_getCurrentUser();

  try {
    res.send(await playMove(req.params.gameId, move, user.id));
  } catch (e) {
    next(e.message);
  }
});

app.post("/games/:gameId/sit/:seat", async (req, res) => {
  const move: MovesType = req.body;
  // TODO: make sure this is set to a valid id once we have user auth
  // const user_id = req.user?.id; */
  const user: User = DELETETHIS_getCurrentUser();

  const players: User[] = await takeSeat(
    req.params.gameId,
    Number(req.params.seat),
    user
  );

  res.send(players);
});

app.post("/games/:gameId/leave/:seat", async (req, res) => {
  const move: MovesType = req.body;
  // TODO: make sure this is set to a valid id once we have user auth
  // const user_id = req.user?.id; */
  const user = DELETETHIS_getCurrentUser();

  const players: User[] = await leaveSeat(
    req.params.gameId,
    Number(req.params.seat),
    user.id
  );

  res.send(players);
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
  const build_path = path.join(__dirname, "../../../packages/vue-client/dist");
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

function next(e: any) {
  throw new Error("Function not implemented.");
}


import express from "express";
import session from "express-session";
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
import {
  createUserWithSessionId,
  deleteUser,
  getUser,
  getUserBySessionId,
} from "./users";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { connectToDb } from "./db";
import passport from "passport";
import { Strategy as CustomStrategy } from "passport-custom";
import {
  GameResponse,
  MovesType,
  DELETETHIS_getCurrentUser,
  User,
  UserResponse,
} from "@ogfcommunity/variants-shared";

const LOCAL_ORIGIN = "http://localhost:3000";

// passport.use(
//   new LocalStrategy(async function (username, password, callback) {
//     try {
//       const user = await LocalUser.findOne({ name: username }).select(
//         "+passwordHash"
//       );
//       // TODO: scrypt instead of bcrypt
//       const passwordHash = user
//         ? user.passwordHash
//         : `$2b$${saltRounds}$TakeSomeTimeToCheckEvenIfUsernameIsWrong1234567890123`;

//       if (!(await bcrypt.compare(password, passwordHash)) || !user) {
//         return callback(null, false, {
//           message: "Wrong username or password.",
//         });
//       }

//       delete user._doc.passwordHash;
//       return callback(null, user);
//     } catch (err) {
//       return callback(err);
//     }
//   })
// );

passport.use(
  "guest",
  new CustomStrategy(async function (req, callback) {
    const token = req.session.id;
    let user = await getUserBySessionId(token);
    if (!user) {
      user = await createUserWithSessionId(token);
    }
    return callback(null, user);
  })
);

passport.serializeUser<string>(function (user: UserResponse, callback) {
  callback(null, user.id);
});

passport.deserializeUser<string>(function (id, callback) {
  getUser(id)
    .then((user) => {
      if (user) {
        callback(null, user);
      } else {
        callback(new Error(`No user with ID: ${id}`));
      }
    })
    .catch((err) => {
      callback(err);
    });
});

// initialize Express
const app = express();
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json()); // TODO: app.use(express.json()) instead? Difference?
app.use(cors({ origin: LOCAL_ORIGIN, credentials: true })); // TODO: Is this still necessary with dev proxy?
app.use(
  session({
    // TODO: Cookie banner or permission necessary?
    secret: process.env.SESSION_SECRET || "Corybas aconitiflorus",
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: "strict",
      secure: "auto", // TODO: See https://www.npmjs.com/package/express-session
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

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

app.get("/guestLogin", function (req, res, next) {
  passport.authenticate("guest", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(new Error(info.message));
    }

    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }

      return res.json(user);
    });
  })(req, res, next);
});

app.get("/checkLogin", function (req, res, next) {
  return res.json(req.user ? req.user : null);
});

app.get("/logout", async function (req, res) {
  const user = req.user as UserResponse;
  if (user.login_type === "guest") {
    deleteUser(user.id);
  }
  req.logout((err) => {
    if (err) throw new Error(err);
    req.session.destroy((err) => {
      if (err) throw new Error(err);
      // res.sendStatus(200); // TODO: client only expects JSON
      res.json({});
    });
  });
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

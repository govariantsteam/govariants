import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import http from "http";
import {
  authenticateUser,
  createUserWithSessionId,
  getUser,
  getUserBySessionId,
} from "./users";
import bodyParser from "body-parser";
import path from "path";
import { connectToDb, getDb } from "./db";
import passport from "passport";
import { Strategy as CustomStrategy } from "passport-custom";
import { Strategy as LocalStrategy } from "passport-local";
import { SITE_NAME, UserResponse } from "@ogfcommunity/variants-shared";
import { router as apiRouter } from "./api";
import * as socket_io from "./socket_io";
import { ITimeoutService, TimeoutService } from "./time-control/timeout";

const LOCAL_ORIGIN = [
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://[::1]:5173",
];

const timeoutService = new TimeoutService();
export function getTimeoutService(): ITimeoutService {
  return timeoutService;
}

passport.use(
  new LocalStrategy(async function (username, password, callback) {
    try {
      const user = await authenticateUser(username, password);

      if (!user) {
        return callback("no user found");
      }
      return callback(null, user);
    } catch (err) {
      return callback(err);
    }
  }),
);

// Initialize MongoDB
connectToDb()
  .then(() => timeoutService.initialize())
  .catch((e) => {
    console.log("Unable to connect to the database.");
    console.log(e);
  });

passport.use(
  "guest",
  new CustomStrategy(async function (req, callback) {
    const token = req.session.id;
    let user = await getUserBySessionId(token);
    if (!user) {
      user = await createUserWithSessionId(token);
    }
    return callback(null, user);
  }),
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
  }),
);
app.use(bodyParser.json()); // TODO: app.use(express.json()) instead? Difference?
app.use(
  session({
    // TODO: Cookie banner or permission necessary?
    secret: process.env.SESSION_SECRET || "Corybas aconitiflorus",
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: "strict",
      secure: "auto", // TODO: See https://www.npmjs.com/package/express-session,
      maxAge: 86_400_000 * 180, // 180 days
    },
    store: MongoStore.create({ client: getDb() }),
  }),
);
app.use(passport.initialize());
app.use(passport.session());

// initialize socket.io
const server = http.createServer(app);

app.use("/api", apiRouter);

socket_io.init(server, LOCAL_ORIGIN);
const io = socket_io.io();
io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("ping", function (data) {
    io.emit("pong", data);
    console.log("ping");
  });

  // source: https://socket.io/how-to/implement-a-subscription-model
  socket.on("subscribe", async (topics) => {
    await socket.join(topics);
  });

  socket.on("unsubscribe", async (topic) => {
    await socket.leave(topic);
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
  console.log(`${SITE_NAME} server started`);
  console.log(`listening on *:${PORT}`);
});

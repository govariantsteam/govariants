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
import path from "path";
import { connectToDb, getDb } from "./db";
import passport from "passport";
import { Strategy as CustomStrategy } from "passport-custom";
import { Strategy as LocalStrategy } from "passport-local";
import { SITE_NAME, UserResponse } from "@ogfcommunity/variants-shared";
import { router as apiRouter } from "./api";
import { getGame } from "./games";
import * as socket_io from "./socket_io";
import { validateSeatSubscription } from "./socket_validation";
import { ITimeoutService, TimeoutService } from "./time-control/timeout";
import { HttpError } from "./http-error";

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
        // This may be the case if a user has been deleted, but the user session persists.
        // Sending null as the second argument invalidates the session.
        callback(null, null);
      }
    })
    .catch((err) => {
      callback(err);
    });
});

// initialize Express
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const sessionMiddleware = session({
  // TODO: Cookie banner or permission necessary?
  secret: process.env.SESSION_SECRET || "Corybas aconitiflorus",
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: "strict",
    secure: "auto", // TODO: See https://www.npmjs.com/package/express-session,
    maxAge: 86_400_000 * 180, // 180 days
    httpOnly: true,
  },
  store: MongoStore.create({ client: getDb() }),
});
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// initialize socket.io
const server = http.createServer(app);

app.use("/api", apiRouter);

socket_io.init(server, LOCAL_ORIGIN);
const io = socket_io.io();

// Share Express session and passport with Socket.IO
io.engine.use(sessionMiddleware);
io.engine.use(passport.initialize());
io.engine.use(passport.session());

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("ping", function (data) {
    io.emit("pong", data);
    console.log("ping");
  });

  socket.on("subscribe", async (topics) => {
    // Passport populates .user on the request via the shared session middleware
    const user = (
      socket.request as http.IncomingMessage & { user?: UserResponse }
    ).user;

    for (const topic of topics) {
      const rejection = await validateSeatSubscription(topic, user, getGame);
      if (rejection) {
        console.warn(`Rejected subscription to ${topic}: ${rejection}`);
        continue;
      }

      await socket.join(topic);
    }
  });

  socket.on("unsubscribe", async (topics) => {
    for (const topic of topics) {
      await socket.leave(topic);
    }
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
  app.get("/{*splat}", (_req, res) => res.sendFile(indexHtml));
}

// Centralized error handler — Express 5 forwards rejected promises from async
// route handlers here automatically, so individual routes no longer need
// try/catch just to send a 500.
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    // Express requires the 4-parameter signature to recognise this as an error handler
    next: express.NextFunction,
  ) => {
    if (res.headersSent) {
      return next(err);
    }
    const status = err instanceof HttpError ? err.status : 500;
    const message = err instanceof Error ? err.message : String(err);
    console.error(err);
    res.status(status).json(message);
  },
);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`${SITE_NAME} server started`);
  console.log(`listening on *:${PORT}`);
});

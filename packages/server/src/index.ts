import express from "express";
import session from "express-session";
import http from "http";
import { Server } from "socket.io";
import { createUserWithSessionId, getUser, getUserBySessionId } from "./users";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { connectToDb } from "./db";
import passport from "passport";
import { Strategy as CustomStrategy } from "passport-custom";
import { UserResponse } from "@ogfcommunity/variants-shared";
import { router as apiRouter } from "./api";

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

app.use("/api", apiRouter);

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

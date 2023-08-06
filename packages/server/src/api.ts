import express from "express";
import passport, { AuthenticateCallback } from "passport";
import {
  getGame,
  getGames,
  createGame,
  playMove,
  takeSeat,
  leaveSeat,
} from "./games";
import {
  checkUsername,
  createUserWithUsernameAndPassword,
  deleteUser,
  getUserByName,
} from "./users";
import {
  GameResponse,
  MovesType,
  User,
  UserResponse,
} from "@ogfcommunity/variants-shared";

export const router = express.Router();

// Set up express routes
router.get("/games/:gameId", async (req, res) => {
  const game: GameResponse = await getGame(req.params.gameId);
  res.send(game);
});

router.get("/games", async (req, res) => {
  const games: GameResponse[] = await getGames(
    Number(req.query.count),
    Number(req.query.offset),
  );
  res.send(games || 0);
});

router.post("/games", async (req, res) => {
  const data = req.body;

  const game: GameResponse = await createGame(data.variant, data.config);

  res.send(game);

  return;
});

router.post("/games/:gameId/move", async (req, res) => {
  const move: MovesType = req.body;
  const user_id = (req.user as User)?.id;

  try {
    res.send(await playMove(req.params.gameId, move, user_id));
  } catch (e) {
    res.status(500);
    res.json(e.message);
  }
});

router.post("/games/:gameId/sit/:seat", async (req, res) => {
  const user = req.user as User | undefined;

  const players: User[] = await takeSeat(
    req.params.gameId,
    Number(req.params.seat),
    user,
  );

  res.send(players);
});

router.post("/games/:gameId/leave/:seat", async (req, res) => {
  // TODO: make sure this is set to a valid id once we have user auth
  const user_id = (req.user as User)?.id;

  const players: User[] = await leaveSeat(
    req.params.gameId,
    Number(req.params.seat),
    user_id,
  );

  res.send(players);
});

router.post("/register", async (req, res, next) => {
  const { username, password } = req.body;
  const user = await getUserByName(username);
  if (user) {
    res.status(500).json(`Username "${username}" already taken!`);
    return;
  }

  try {
    checkUsername(username);
  } catch (e) {
    res.status(500).json(e);
    return;
  }

  await createUserWithUsernameAndPassword(username, password);
  passport.authenticate("local", make_auth_cb(req, res))(req, res, next);
});

function make_auth_cb(
  req: express.Request,
  res: express.Response,
): AuthenticateCallback {
  return (err: Error, user?: Express.User, info?: { message: string }) => {
    if (err) {
      return res.status(500).json(err.message);
    }
    if (!user) {
      return res.status(500).json(info.message);
    }

    req.logIn(user, function (err) {
      if (err) {
        return res.status(500).json(err.message);
      }

      return res.json(user);
    });
  };
}

router.post("/login", (req, res, next) => {
  passport.authenticate("local", make_auth_cb(req, res))(req, res, next);
});

router.get("/guestLogin", function (req, res, next) {
  passport.authenticate("guest", make_auth_cb(req, res))(req, res, next);
});

router.get("/checkLogin", function (req, res) {
  return res.json(req.user ? req.user : null);
});

router.get("/logout", async function (req, res) {
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

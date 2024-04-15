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
  GamesFilter,
  MovesType,
  User,
  UserResponse,
} from "@ogfcommunity/variants-shared";
import { io } from "./socket_io";

export const router = express.Router();

// Set up express routes
router.get("/games/:gameId", async (req, res) => {
  try {
    const game: GameResponse = await getGame(req.params.gameId);
    res.send(game);
  } catch (e) {
    res.status(500);
    res.json(e.message);
  }
});

router.get("/games", async (req, res) => {
  const filter: GamesFilter = {
    user_id: req.query.user_id?.toString(),
    variant: req.query.variant?.toString(),
  };

  const games: GameResponse[] = await getGames(
    Number(req.query.count),
    Number(req.query.offset),
    filter,
  );
  res.send(games || 0);
});

router.post("/games", async (req, res) => {
  const data = req.body;

  try {
    const game: GameResponse = await createGame(data.variant, data.config);
    res.send(game);
  } catch (e) {
    res.status(500);
    res.json(e.message);
  }
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

  try {
    const players: User[] = await takeSeat(
      req.params.gameId,
      Number(req.params.seat),
      user,
    );

    io().emit(`game/${req.params.gameId}/seats`, players);
    res.send(players);
  } catch (e) {
    res.status(409);
    res.json(e.message);
  }
});

router.post("/games/:gameId/leave/:seat", async (req, res) => {
  // TODO: make sure this is set to a valid id once we have user auth
  const user_id = (req.user as User)?.id;

  const players: User[] = await leaveSeat(
    req.params.gameId,
    Number(req.params.seat),
    user_id,
  );

  io().emit(`game/${req.params.gameId}/seats`, players);
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

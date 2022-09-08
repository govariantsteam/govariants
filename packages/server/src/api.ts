import express from "express";
import passport from "passport";
import {
  getGame,
  getGames,
  createGame,
  playMove,
  takeSeat,
  leaveSeat,
} from "./games";
import { deleteUser } from "./users";
import {
  GameResponse,
  MovesType,
  DELETETHIS_getCurrentUser,
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
  const games: GameResponse[] = await getGames(Number(req.query.page));
  res.send(games || 0);
});

router.post("/games", async (req, res) => {
  const data = req.body;

  const game: GameResponse = await createGame(data.variant, data.config);

  res.send(game);

  return;
});

router.post("/games/:gameId/move", async (req, res, next) => {
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

router.post("/games/:gameId/sit/:seat", async (req, res) => {
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

router.post("/games/:gameId/leave/:seat", async (req, res) => {
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

router.get("/guestLogin", function (req, res, next) {
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

router.get("/checkLogin", function (req, res, next) {
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

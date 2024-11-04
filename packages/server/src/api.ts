import express from "express";
import { makeGameObject } from "@ogfcommunity/variants-shared";
import passport, { AuthenticateCallback } from "passport";
import {
  getGame,
  getGames,
  createGame,
  playMove,
  takeSeat,
  leaveSeat,
  getGameState,
} from "./games";
import {
  checkUsername,
  createUserWithUsernameAndPassword,
  deleteUser,
  getUserByName,
  updateUserRating,
  getUser,
} from "./users";
import {
  getOnlyMove,
  GameResponse,
  GamesFilter,
  MovesType,
  User,
  UserResponse,
  GameInitialResponse,
} from "@ogfcommunity/variants-shared";
import { io } from "./socket_io";

export const router = express.Router();

// Set up express routes

router.get("/game/:gameId/sgf", async (req, res) => {
  try {
    const game = await getGame(req.params.gameId);

    const game_obj = makeGameObject(game.variant, game.config);

    game.moves.forEach((moves) => {
      const { player, move } = getOnlyMove(moves);
      game_obj.playMove(player, move);
    });

    if (game_obj.getSGF() === "") {
      throw new Error(`SGF not supported for variant ${game.variant}`);
    } else if (game_obj.getSGF() === "non-rectangular") {
      throw new Error("SGF for non rectangular boards is not possible");
    } else {
      res.set({
        "Content-Disposition": `attachment; filename="game_${req.params.gameId}.sgf"`,
      });
      res.set("Content-Type", "text/plain");
      res.send(game_obj.getSGF());
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/games/:gameId", async (req, res) => {
  try {
    const game: GameResponse = await getGame(req.params.gameId);

    //updating player 0 rating to 700
    const updateStatus = await updateUserRating(game.players[0].id, 700);
    //accessing user from db to check if update was made
    const userInfo = await getUser(game.players[0].id);

    res.json({
      game,
      updateStatus,
      userInfo,
    });
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

  if (!req.user) {
    // unauthorized
    res.status(401);
    res.json("To create a game, please register an account.");
    return;
  }

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

router.get("/games/:gameId/state/initial", async (req, res) => {
  try {
    const game = await getGame(req.params.gameId);
    const stateResponse = await getGameState(game, null, null);
    const result: GameInitialResponse = {
      variant: game.variant,
      config: game.config,
      id: game.id,
      players: game.players,
      stateResponse: stateResponse,
    };
    res.send(result);
  } catch (e) {
    res.status(500);
    res.json(e.message);
  }
});

router.get("/games/:gameId/state", async (req, res) => {
  try {
    const seat = req.query.seat === "" ? null : Number(req.query.seat);
    const round = req.query.round === "" ? null : Number(req.query.round);
    const game = await getGame(req.params.gameId);
    const stateResponse = await getGameState(game, seat, round);
    res.send(stateResponse);
  } catch (e) {
    res.status(500);
    res.json(e.message);
  }
});

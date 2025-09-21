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
  repairGame,
  subscribeToGame,
} from "./games";
import {
  checkUsername,
  createUserWithUsernameAndPassword,
  deleteUser,
  getUser,
  getUserByName,
  setUserRole,
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
import { checkCSRFToken, generateCSRFToken } from "./csrf_guard";
import { getUserNotifications } from "./notifications/notifications";

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

router.post("/games", checkCSRFToken, async (req, res) => {
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

router.post("/games/:gameId/move", checkCSRFToken, async (req, res) => {
  const move: MovesType = req.body;
  const user_id = (req.user as User)?.id;

  try {
    res.send(await playMove(req.params.gameId, move, user_id));
  } catch (e) {
    res.status(500);
    res.json(e.message);
  }
});

router.post("/games/:gameId/sit/:seat", checkCSRFToken, async (req, res) => {
  const user = req.user as UserResponse | undefined;

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

router.post("/games/:gameId/leave/:seat", checkCSRFToken, async (req, res) => {
  // TODO: make sure this is set to a valid id once we have user auth
  const user = req.user as UserResponse | undefined;

  const players: User[] = await leaveSeat(
    req.params.gameId,
    Number(req.params.seat),
    user,
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

router.put("/users/:userId/role", checkCSRFToken, async (req, res) => {
  const { role } = req.body;
  try {
    if (!req.user || (req.user as UserResponse).role !== "admin") {
      // unauthorized
      res.status(401);
      res.json("Only Admins may set user roles.");
      return;
    }

    if (!["admin"].includes(role)) {
      throw new Error(`Invalid role: ${role}`);
    }

    const userToUpdate = await getUser(req.params.userId);

    if (userToUpdate.login_type !== "persistent") {
      throw new Error(
        `Cannot assign role "${role}" to user with "${userToUpdate.login_type}" type.`,
      );
    }

    await setUserRole(req.params.userId, role);

    userToUpdate.role = role;
    res.send(userToUpdate);
  } catch (e) {
    res.status(500);
    res.json(e.message);
  }
});

router.get("/users/:userId", async (req, res) => {
  try {
    const user = await getUser(req.params.userId);
    if (!user) {
      res.status(404);
      res.json("User does not exist");
    }
    res.send(user);
  } catch (e) {
    res.status(500);
    res.json(e.message);
  }
});

router.delete("/users/:userId", checkCSRFToken, async (req, res) => {
  if ((req.user as UserResponse).role !== "admin") {
    res.status(401);
    res.json("You are not authorized to delete users");
    return;
  }

  try {
    // TODO: we should probably make deleteUser async so that we can report DB errors to the API caller
    deleteUser(req.params.userId);
    res.json("success");
  } catch (e) {
    res.status(500);
    res.json(e.message);
  }
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

      generateCSRFToken(req);
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

// TODO: improve types
/* eslint-disable @typescript-eslint/no-explicit-any */
router.get("/checkLogin", function (req: any, res) {
  return res.json(
    req.user ? { user: req.user, csrf_token: req.session.csrfToken } : null,
  );
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

router.post("/game/:gameId/repair", checkCSRFToken, async (req, res) => {
  try {
    await repairGame(req.params.gameId);
    res.send({});
  } catch (e) {
    res.status(500);
    res.json(e.message);
  }
});

router.get("/notifications", checkCSRFToken, async (req, res) => {
  if (!req.user) {
    res.send([]);
    return;
  }

  try {
    res.send(await getUserNotifications((req.user as User).id));
  } catch (e) {
    res.status(500);
    res.json(e.message);
  }
});

router.post("/game/:gameId/subscribe", checkCSRFToken, async (req, res) => {
  try {
    if (!req.user || typeof req.query.gameId !== "string") {
      res.send([]);
      return;
    }
    const { notificationTypes } = req.body;
    const gameId = req.query.gameId as string;
    const userId = (req.user as User).id;

    const success = await subscribeToGame(gameId, userId, notificationTypes);
    if (success) {
      res.status(200);
    } else {
      res.status(500);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

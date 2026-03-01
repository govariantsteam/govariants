import express from "express";
import {
  makeGameObject,
  NotificationsResponse,
  groupBy,
} from "@ogfcommunity/variants-shared";
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
  subscribeToGameNotifications,
  getGamesById,
  tryComputeState,
} from "./games";
import {
  checkUsername,
  createUserWithUsernameAndPassword,
  deleteUser,
  getUser,
  getUserByName,
  getUserEmail,
  setUserRole,
  setUserEmail,
} from "./users";
import {
  getOnlyMove,
  GameResponse,
  GamesFilter,
  MovesType,
  User,
  UserResponse,
  GameInitialResponse,
  validateNotificationTypeArray,
} from "@ogfcommunity/variants-shared";
import { io } from "./socket_io";
import { checkCSRFToken, generateCSRFToken } from "./csrf_guard";
import { sendEmail } from "./email";
import { HttpError } from "./http-error";
import {
  clearNotifications,
  getUserNotifications,
  getUserNotificationsCount,
  markAsRead,
} from "./notifications/notifications";

export const router = express.Router();

// Set up express routes

router.get("/game/:gameId/sgf", async (req, res) => {
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
  const gameStates = games.map((game) =>
    tryComputeState(game, req.user as User | undefined),
  );
  res.send(gameStates || 0);
});

router.post("/games", checkCSRFToken, async (req, res) => {
  const data = req.body;

  if (!req.user) {
    // unauthorized
    res.status(401).json("To create a game, please register an account.");
    return;
  }

  const user = req.user as User;
  const game: GameResponse = await createGame(data.variant, data.config, user);
  res.send(game);
});

router.post("/games/:gameId/move", checkCSRFToken, async (req, res) => {
  const move: MovesType = req.body;
  const user_id = (req.user as User)?.id;

  res.send(await playMove(req.params.gameId, move, user_id));
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
    throw new HttpError(409, e instanceof Error ? e.message : String(e));
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
  const { username, password, email } = req.body;
  const user = await getUserByName(username);
  if (user) {
    res.status(500).json(`Username "${username}" already taken!`);
    return;
  }

  checkUsername(username);

  await createUserWithUsernameAndPassword(username, password, email);
  passport.authenticate("local", make_auth_cb(req, res))(req, res, next);
});

router.put("/users/:userId/role", checkCSRFToken, async (req, res) => {
  const { role } = req.body;

  if (!req.user || (req.user as UserResponse).role !== "admin") {
    res.status(401).json("Only Admins may set user roles.");
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
});

router.get("/users/:userId/email", checkCSRFToken, async (req, res) => {
  if (!req.user) {
    res.status(401).json("You must be logged in to view email.");
    return;
  }

  const currentUser = req.user as UserResponse;

  // Users can only view their own email (unless they're an admin)
  if (currentUser.id !== req.params.userId && currentUser.role !== "admin") {
    res.status(403).json("You can only view your own email.");
    return;
  }

  const email = await getUserEmail(req.params.userId);
  res.json({ email: email || null });
});

router.put("/users/:userId/email", checkCSRFToken, async (req, res) => {
  const { email } = req.body;

  if (!req.user) {
    res.status(401).json("You must be logged in to update email.");
    return;
  }

  const currentUser = req.user as UserResponse;

  // Users can only update their own email (unless they're an admin)
  if (currentUser.id !== req.params.userId && currentUser.role !== "admin") {
    res.status(403).json("You can only update your own email.");
    return;
  }

  const userToUpdate = await getUser(req.params.userId);

  if (userToUpdate.login_type !== "persistent") {
    throw new Error(
      `Cannot set email for user with "${userToUpdate.login_type}" type.`,
    );
  }

  await setUserEmail(req.params.userId, email);

  res.json({ success: true, email });
});

router.get("/users/:userId", async (req, res) => {
  const user = await getUser(req.params.userId);
  if (!user) {
    res.status(404).json("User does not exist");
    return;
  }
  res.send(user);
});

router.delete("/users/:userId", checkCSRFToken, async (req, res) => {
  if ((req.user as UserResponse).role !== "admin") {
    res.status(401).json("You are not authorized to delete users");
    return;
  }

  // TODO: we should probably make deleteUser async so that we can report DB errors to the API caller
  deleteUser(req.params.userId);
  res.json("success");
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
  const game = await getGame(req.params.gameId);
  const stateResponse = getGameState(game, null, null);
  const result: GameInitialResponse = {
    variant: game.variant,
    config: game.config,
    id: game.id,
    players: game.players,
    creator: game.creator,
    ...stateResponse,
  };
  if (req.user && game.subscriptions) {
    result.subscription = game.subscriptions[(req.user as User).id] ?? [];
  }
  res.send(result);
});

router.get("/games/:gameId/state", async (req, res) => {
  const seat = req.query.seat === "" ? null : Number(req.query.seat);
  const round = req.query.round === "" ? null : Number(req.query.round);
  const game = await getGame(req.params.gameId);
  const stateResponse = getGameState(game, seat, round);
  res.send(stateResponse);
});

router.post("/game/:gameId/repair", checkCSRFToken, async (req, res) => {
  await repairGame(req.params.gameId);
  res.send({});
});

router.post("/admin/test-email", checkCSRFToken, async (req, res) => {
  if (!req.user || (req.user as UserResponse).role !== "admin") {
    res.status(401).json("Only admins may send test emails.");
    return;
  }

  const { to } = req.body;
  if (!to) {
    res.status(400).json("Email address is required.");
    return;
  }

  await sendEmail(
    "GoVariants Test Email",
    to,
    "Test Email\n\nThis is a test email from GoVariants. If you received this, your email configuration is working correctly!",
    "<h1>Test Email</h1><p>This is a test email from GoVariants. If you received this, your email configuration is working correctly!</p>",
  );

  res.json({ success: true, message: "Test email sent successfully." });
});

router.get("/notifications/count", checkCSRFToken, async (req, res) => {
  if (!req.user) {
    res.sendStatus(401);
    return;
  }

  res.send({
    count: await getUserNotificationsCount((req.user as User).id),
  });
});

router.get("/notifications", checkCSRFToken, async (req, res) => {
  if (!req.user) {
    res.send([]);
    return;
  }

  const userNotifications = await getUserNotifications((req.user as User).id);
  const groups = groupBy(userNotifications, (n) => n.gameId);
  const gameIds = groups.map(([gameId, _]) => gameId);
  const gameStates = (await getGamesById([...gameIds])).map((game) =>
    tryComputeState(game, req.user as User),
  );
  const combined: NotificationsResponse[] = groups.map(
    ([gameId, notifications]) => ({
      gameId: gameId,
      notifications: notifications,
      gameState: gameStates.find((x) => x.id === gameId),
    }),
  );
  res.send(combined);
});

router.post("/game/:gameId/subscribe", checkCSRFToken, async (req, res) => {
  const { notificationTypes } = req.body;
  validateNotificationTypeArray(notificationTypes);
  const userId = (req.user as User).id;

  const success = await subscribeToGameNotifications(
    req.params.gameId,
    userId,
    notificationTypes,
  );

  if (success) {
    res.status(200);
  } else {
    res.status(500);
  }
  res.send({ success: true });
});

router.post(
  "/notifications/:gameId/mark-as-read",
  checkCSRFToken,
  async (req, res) => {
    const userId = (req.user as User).id;

    await markAsRead(userId, req.params.gameId);
    res.send({});
  },
);

router.post(
  "/notifications/:gameId/clear",
  checkCSRFToken,
  async (req, res) => {
    const userId = (req.user as User).id;

    await clearNotifications(userId, req.params.gameId);
    res.send({});
  },
);

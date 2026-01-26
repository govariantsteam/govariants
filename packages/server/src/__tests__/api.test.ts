import request from "supertest";
import express, { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import {
  setupTestDb,
  teardownTestDb,
  clearTestDb,
  getTestClient,
} from "./helpers/setup";
import { UserResponse } from "@ogfcommunity/variants-shared";

// Mock modules BEFORE importing api - this prevents the real index.ts from loading
jest.mock("../socket_io");
jest.mock("../index");

// Set a reasonable timeout for all tests
jest.setTimeout(10000);

// Extend session type for CSRF token
declare module "express-session" {
  interface SessionData {
    csrfToken?: string;
  }
}

// We need to set up the test DB BEFORE importing modules that use the database
let app: Express;
let apiRouter: typeof import("../api").router;

beforeAll(async () => {
  // Set up in-memory MongoDB first
  await setupTestDb();

  // Now we can import modules that depend on the database
  const apiModule = await import("../api");
  apiRouter = apiModule.router;

  // Create test Express app
  app = createTestApp();
}, 30000); // Increase timeout for MongoDB Memory Server startup

afterAll(async () => {
  await teardownTestDb();
});

beforeEach(async () => {
  await clearTestDb();
});

/**
 * Creates a test Express app with the API router.
 * Optionally inject a mock user for authenticated requests.
 */
function createTestApp(mockUser?: Partial<UserResponse>): Express {
  const testApp = express();
  testApp.use(express.json());

  // Mock session middleware
  testApp.use(
    session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any,
  );

  // Inject user and/or set up CSRF token before routes
  testApp.use((req: Request, _res: Response, next: NextFunction) => {
    if (mockUser) {
      req.user = mockUser as UserResponse;
    }

    // If the request has a CSRF-Token header, set the session token to match
    // This allows tests to pass CSRF validation
    const csrfHeader = req.get("CSRF-Token");
    if (csrfHeader) {
      req.session.csrfToken = csrfHeader;
    }

    next();
  });

  testApp.use("/api", apiRouter);

  // Error handling middleware - catches double response errors
  testApp.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error("Express error:", err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message });
      }
    },
  );

  return testApp;
}

describe("API Endpoints", () => {
  describe("GET /api/games", () => {
    it("returns an empty array when no games exist", async () => {
      const response = await request(app)
        .get("/api/games?count=10&offset=0")
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it("returns games when they exist", async () => {
      // Insert a test game directly into the database
      const db = getTestClient().db("govariants");
      await db.collection("games").insertOne({
        variant: "baduk",
        config: { width: 9, height: 9, komi: 5.5 },
        moves: [],
        players: [undefined, undefined],
      });

      const response = await request(app)
        .get("/api/games?count=10&offset=0")
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].variant).toBe("baduk");
    });

    it("respects count parameter", async () => {
      const db = getTestClient().db("govariants");
      // Insert 5 games
      await db.collection("games").insertMany([
        {
          variant: "baduk",
          config: { width: 9, height: 9, komi: 5.5 },
          moves: [],
          players: [],
        },
        {
          variant: "baduk",
          config: { width: 9, height: 9, komi: 5.5 },
          moves: [],
          players: [],
        },
        {
          variant: "baduk",
          config: { width: 9, height: 9, komi: 5.5 },
          moves: [],
          players: [],
        },
        {
          variant: "baduk",
          config: { width: 9, height: 9, komi: 5.5 },
          moves: [],
          players: [],
        },
        {
          variant: "baduk",
          config: { width: 9, height: 9, komi: 5.5 },
          moves: [],
          players: [],
        },
      ]);

      const response = await request(app)
        .get("/api/games?count=3&offset=0")
        .expect(200);

      expect(response.body).toHaveLength(3);
    });
  });

  describe("POST /api/games", () => {
    it("rejects unauthenticated requests", async () => {
      const response = await request(app)
        .post("/api/games")
        .set("CSRF-Token", "test-csrf-token")
        .send({ variant: "baduk", config: { width: 9, height: 9, komi: 5.5 } })
        .expect(401);

      expect(response.body).toContain("register an account");
    });

    it("creates a game for authenticated users", async () => {
      // Create app with authenticated user
      const db = getTestClient().db("govariants");

      // First create a user in the database
      const userResult = await db.collection("users").insertOne({
        username: "testuser",
        login_type: "persistent",
        password_hash: "fake-hash",
      });

      const authApp = createTestApp({
        id: userResult.insertedId.toString(),
        username: "testuser",
        login_type: "persistent",
      });

      const response = await request(authApp)
        .post("/api/games")
        .set("CSRF-Token", "test-csrf-token")
        .send({ variant: "baduk", config: { width: 9, height: 9, komi: 5.5 } })
        .expect(200);

      expect(response.body.variant).toBe("baduk");
      expect(response.body.id).toBeDefined();
    });
  });

  describe("GET /api/games/:gameId/state/initial", () => {
    it("returns 500 for non-existent game", async () => {
      await request(app)
        .get("/api/games/507f1f77bcf86cd799439011/state/initial")
        .expect(500);
    });

    it("returns initial state for existing game", async () => {
      const db = getTestClient().db("govariants");
      const result = await db.collection("games").insertOne({
        variant: "baduk",
        config: { width: 9, height: 9, komi: 5.5 },
        moves: [],
        players: [undefined, undefined],
      });

      const response = await request(app)
        .get(`/api/games/${result.insertedId.toString()}/state/initial`)
        .expect(200);

      expect(response.body.variant).toBe("baduk");
      expect(response.body.id).toBe(result.insertedId.toString());
    });
  });

  describe("GET /api/users/:userId", () => {
    it("returns 404 for non-existent user", async () => {
      const response = await request(app)
        .get("/api/users/507f1f77bcf86cd799439011")
        .expect(404);

      expect(response.body).toContain("does not exist");
    });

    it("returns user data for existing user", async () => {
      const db = getTestClient().db("govariants");
      const result = await db.collection("users").insertOne({
        username: "testuser",
        login_type: "persistent",
        password_hash: "fake-hash",
      });

      const response = await request(app)
        .get(`/api/users/${result.insertedId.toString()}`)
        .expect(200);

      expect(response.body.username).toBe("testuser");
    });
  });
});

describe("Response Handling", () => {
  it("should not crash on rapid sequential requests", async () => {
    // This test helps catch race conditions and double-response issues
    const requests = Array(10)
      .fill(null)
      .map(() => request(app).get("/api/games?count=10&offset=0"));

    const responses = await Promise.all(requests);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

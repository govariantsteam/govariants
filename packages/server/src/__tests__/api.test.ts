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

import { resetMocks as resetSocketIoMocks } from "../__mocks__/socket_io";

// Set a reasonable timeout for all tests
jest.setTimeout(10000);

/** A valid MongoDB ObjectId that doesn't exist in the test database */
const NON_EXISTENT_ID = "507f1f77bcf86cd799439011";

/** Helper to get the test database */
async function getTestDb() {
  return (await getTestClient()).db("govariants");
}

/** Creates a test game document */
function makeTestGame(overrides: Record<string, unknown> = {}) {
  return {
    variant: "baduk",
    config: { width: 9, height: 9, komi: 5.5 },
    moves: [] as unknown[],
    players: [null, null] as (null | unknown)[],
    ...overrides,
  };
}

/** Creates a test user document */
function makeTestUser(overrides: Record<string, unknown> = {}) {
  return {
    username: "testuser",
    login_type: "persistent",
    password_hash: "fake-hash",
    ...overrides,
  };
}

// Extend session type for CSRF token
declare module "express-session" {
  interface SessionData {
    csrfToken?: string;
  }
}

// We need to set up the test DB BEFORE importing modules that use the database
// TODO: Consider creating a fresh app instance per test for better isolation.
// Currently sharing one app instance - this works because Express apps are stateless,
// but hermetic tests (fresh app per test) would prevent any risk of cross-test pollution.
// If you encounter flaky tests or test order dependencies, refactor to use beforeEach.
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
  resetSocketIoMocks();
});

/**
 * Options for creating a test Express app.
 */
interface CreateTestAppOptions {
  /** Mock user for authenticated requests */
  mockUser?: Partial<UserResponse>;
  /** Pre-set session CSRF token (for testing CSRF validation) */
  sessionCsrfToken?: string;
}

/**
 * Creates a test Express app with the API router.
 * Optionally inject a mock user for authenticated requests.
 */
function createTestApp(options: CreateTestAppOptions = {}): Express {
  const { mockUser, sessionCsrfToken } = options;
  const testApp = express();
  testApp.use(express.json());

  // Mock session middleware
  testApp.use(
    session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: true,
    }),
  );

  // Inject user and/or set up CSRF token before routes
  testApp.use((req: Request, _res: Response, next: NextFunction) => {
    if (mockUser) {
      req.user = mockUser as UserResponse;
    }

    // If a session CSRF token is provided in options, set it (for testing CSRF validation)
    if (sessionCsrfToken) {
      req.session.csrfToken = sessionCsrfToken;
    } else {
      // If the request has a CSRF-Token header, set the session token to match
      // This allows tests to pass CSRF validation by default
      const csrfHeader = req.get("CSRF-Token");
      if (csrfHeader) {
        req.session.csrfToken = csrfHeader;
      }
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
      // Silently handle errors in tests - the 500 response is sufficient for assertions
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
      const db = await getTestDb();
      await db.collection("games").insertOne(makeTestGame());

      const response = await request(app)
        .get("/api/games?count=10&offset=0")
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].variant).toBe("baduk");
    });

    it("respects count parameter", async () => {
      const db = await getTestDb();
      await db
        .collection("games")
        .insertMany(Array.from({ length: 5 }, () => makeTestGame()));

      const response = await request(app)
        .get("/api/games?count=3&offset=0")
        .expect(200);

      expect(response.body).toHaveLength(3);
    });
  });

  describe("POST /api/games", () => {
    it("rejects requests without CSRF token when session has one", async () => {
      // Create app with a pre-set CSRF token in session
      const csrfApp = createTestApp({ sessionCsrfToken: "server-csrf-token" });

      const response = await request(csrfApp)
        .post("/api/games")
        // No CSRF-Token header sent
        .send({ variant: "baduk", config: { width: 9, height: 9, komi: 5.5 } })
        .expect(401);

      expect(response.body.message).toBe("Token has not been provided.");
    });

    it("rejects unauthenticated requests", async () => {
      const response = await request(app)
        .post("/api/games")
        .set("CSRF-Token", "test-csrf-token")
        .send({ variant: "baduk", config: { width: 9, height: 9, komi: 5.5 } })
        .expect(401);

      expect(response.body).toContain("register an account");
    });

    it("creates a game for authenticated users", async () => {
      const db = await getTestDb();
      const userResult = await db.collection("users").insertOne(makeTestUser());

      const authApp = createTestApp({
        mockUser: {
          id: userResult.insertedId.toString(),
          username: "testuser",
          login_type: "persistent",
        },
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
    // TODO: API returns 500 for non-existent game; consider returning 404 instead
    it("returns error for non-existent game", async () => {
      await request(app)
        .get(`/api/games/${NON_EXISTENT_ID}/state/initial`)
        .expect(500);
    });

    it("returns initial state for existing game", async () => {
      const db = await getTestDb();
      const result = await db.collection("games").insertOne(makeTestGame());

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
        .get(`/api/users/${NON_EXISTENT_ID}`)
        .expect(404);

      expect(response.body).toContain("does not exist");
    });

    it("returns user data for existing user", async () => {
      const db = await getTestDb();
      const result = await db.collection("users").insertOne(makeTestUser());

      const response = await request(app)
        .get(`/api/users/${result.insertedId.toString()}`)
        .expect(200);

      expect(response.body.username).toBe("testuser");
    });
  });
});

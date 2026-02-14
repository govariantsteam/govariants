import { MongoMemoryServer } from "mongodb-memory-server";
import type { MongoClient } from "mongodb";

let mongoServer: MongoMemoryServer;

/**
 * Set up an in-memory MongoDB server for testing.
 *
 * CRITICAL ORDERING REQUIREMENT:
 * This function MUST be called in a beforeAll hook BEFORE any module that uses
 * the database is imported. This is because:
 *
 * 1. The database module reads ATLAS_URI at import time (or first use)
 * 2. Jest's module caching means once a module is imported, subsequent imports
 *    return the cached version with the original configuration
 *
 * Correct usage:
 * ```typescript
 * let app: Express;
 *
 * beforeAll(async () => {
 *   // FIRST: Set up the test database (sets ATLAS_URI)
 *   await setupTestDb();
 *
 *   // THEN: Import modules that depend on the database
 *   const apiModule = await import("../api");
 *   // ...
 * });
 * ```
 *
 * If you see connection errors or tests connecting to wrong database,
 * check that no database-dependent module is imported at the top of your test file.
 */
export async function setupTestDb(): Promise<void> {
  mongoServer = await MongoMemoryServer.create();
  // Get base URI and append database name to ensure consistent database usage
  const baseUri = mongoServer.getUri();
  const url = new URL(baseUri);
  url.pathname = "/govariants";
  const uri = url.toString();

  // Set the environment variable before any DB module is imported
  process.env.ATLAS_URI = uri;

  // Import and connect to DB after setting the URI
  const { connectToDb } = await import("../../db");
  await connectToDb();
}

/**
 * Clean up the test database after tests complete.
 */
export async function teardownTestDb(): Promise<void> {
  // Close the app's DB connection
  const { getDb } = await import("../../db");
  try {
    await getDb().close();
  } catch (error) {
    console.warn("Warning: Error closing database connection:", error);
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
}

/**
 * Get the test MongoDB client for direct database operations in tests.
 * This returns the same client used by the app to ensure consistency.
 */
export async function getTestClient(): Promise<MongoClient> {
  const { getDb } = await import("../../db");
  return getDb();
}

/**
 * Clear all collections in the test database.
 * Useful for resetting state between tests.
 */
export async function clearTestDb(): Promise<void> {
  const client = await getTestClient();
  const db = client.db("govariants");
  const collections = await db.listCollections().toArray();
  await Promise.all(
    collections.map((col) => db.collection(col.name).deleteMany({})),
  );
}

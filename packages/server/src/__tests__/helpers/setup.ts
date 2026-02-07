import { MongoMemoryServer } from "mongodb-memory-server";
import type { MongoClient } from "mongodb";

let mongoServer: MongoMemoryServer;

/**
 * Set up an in-memory MongoDB server for testing.
 * Must be called before importing any modules that use the database.
 */
export async function setupTestDb(): Promise<void> {
  mongoServer = await MongoMemoryServer.create();
  // Get base URI and append database name to ensure consistent database usage
  const baseUri = mongoServer.getUri();
  const uri = baseUri.endsWith("/")
    ? `${baseUri}govariants`
    : `${baseUri}/govariants`;

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
  } catch {
    // ignore if already closed
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
}

/**
 * Get the test MongoDB client for direct database operations in tests.
 * This returns the same client used by the app to ensure consistency.
 */
export function getTestClient(): MongoClient {
  // Use dynamic import to avoid circular dependency issues
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getDb } = require("../../db");
  return getDb();
}

/**
 * Clear all collections in the test database.
 * Useful for resetting state between tests.
 */
export async function clearTestDb(): Promise<void> {
  const client = getTestClient();
  const db = client.db("govariants");
  const collections = await db.listCollections().toArray();
  await Promise.all(
    collections.map((col) => db.collection(col.name).deleteMany({})),
  );
}

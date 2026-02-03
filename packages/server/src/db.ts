import { Collection, MongoClient } from "mongodb";
import { UserNotifications } from "./notifications/notifications.types";

let client: MongoClient = undefined;

export async function connectToDb() {
  const ATLAS_URI = process.env.ATLAS_URI || "mongodb://127.0.0.1:27017";

  // initialize MongoDB
  client = new MongoClient(ATLAS_URI);
  try {
    await client.connect();

    // Establish and verify connection
    await client.db("govariants").command({ ping: 1 });
    console.log("Connected successfully to database");
  } catch {
    console.log("Failed to connect to database");
  }
}

export function getDb() {
  if (!client) {
    throw Error("Could not connect to database.");
  }

  return client;
}

export function notifications(): Collection<UserNotifications> {
  return getDb().db().collection<UserNotifications>("notifications");
}

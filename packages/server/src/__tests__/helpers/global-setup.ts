import { MongoBinary } from "mongodb-memory-server";

// On a cold cache, parallel test files each download the mongod binary and race
// for its lock file. Fetching it once here leaves them nothing to race for.
export default async function setup(): Promise<void> {
  await MongoBinary.getPath({});
}

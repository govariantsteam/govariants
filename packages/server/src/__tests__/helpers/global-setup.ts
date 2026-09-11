import { MongoBinary } from "mongodb-memory-server";

// Fetching once here prevents a mongod download per test suite, which would
// otherwise race for the same lock file on a cold cache.
export default async function setup(): Promise<void> {
  await MongoBinary.getPath({});
}

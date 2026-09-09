import { MongoBinary } from "mongodb-memory-server";

/**
 * Every test file that touches the database starts its own MongoMemoryServer,
 * and each one downloads the mongod binary if it is not already cached. CI
 * caches yarn's dependencies but not ~/.cache/mongodb-binaries, so on a cold
 * cache those downloads run in parallel, race for the same lock file, and all
 * but one crash with "Cannot unlock file ... it is not locked by this process".
 *
 * Fetching the binary once here, before any worker starts, leaves them nothing
 * to race for. It is a no-op once the binary is cached.
 */
export default async function setup(): Promise<void> {
  await MongoBinary.getPath({});
}

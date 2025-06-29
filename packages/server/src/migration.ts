import * as migrateMongo from "migrate-mongo";
import * as config from "../migrate-mongo-config.js";

export async function migrate() {
  // @ts-expect-error ts(2345)
  migrateMongo.config.set(config);
  const { db, client } = await migrateMongo.database.connect();
  await migrateMongo.up(db, client);
  await client.close();
}

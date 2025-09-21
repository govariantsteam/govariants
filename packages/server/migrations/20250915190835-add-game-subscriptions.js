module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    await client.withSession((session) =>
      session.withTransaction(async () => {
        await db
          .collection("games")
          .updateMany({}, { $set: { subscriptions: {} } });
      }),
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    await client.withSession((session) =>
      session.withTransaction(async () => {
        await db
          .collection("games")
          .updateMany({}, { $unset: { subscriptions: [] } });
      }),
    );
  },
};

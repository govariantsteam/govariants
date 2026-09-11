module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    // A browser has exactly one push endpoint, and subscriptions are upserted
    // on it, so the unique index is what keeps re-subscribing idempotent.
    await db
      .collection("push_subscriptions")
      .createIndex({ endpoint: 1 }, { name: "push_endpoint", unique: true });
    // Sending a notification looks up every subscription for a set of users.
    await db
      .collection("push_subscriptions")
      .createIndex({ userId: 1 }, { name: "push_user" });
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    await db.collection("push_subscriptions").dropIndex("push_endpoint");
    await db.collection("push_subscriptions").dropIndex("push_user");
  },
};

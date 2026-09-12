module.exports = {
  /**
   * Store a `createdAt` date on games and users.
   *
   * The backfilled values are exact, not approximations: the leading four bytes
   * of an ObjectId are a second-resolution creation timestamp, so `$toDate` on
   * `_id` recovers when each document was really inserted. Documents created
   * from here on carry a millisecond-resolution `new Date()` instead.
   *
   * Filtering on `createdAt: { $exists: false }` keeps this re-runnable if it
   * fails partway through.
   *
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    for (const name of ["games", "users"]) {
      await db
        .collection(name)
        .updateMany(
          { createdAt: { $exists: false }, _id: { $type: "objectId" } },
          [{ $set: { createdAt: { $toDate: "$_id" } } }],
        );
    }
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    for (const name of ["games", "users"]) {
      await db.collection(name).updateMany({}, { $unset: { createdAt: "" } });
    }
  },
};

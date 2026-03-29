module.exports = {
  /**
   * Convert players arrays from embedded user objects to user ID strings.
   *
   * Before: players: [{ id: "abc", username: "foo", ranking: {...} }, null]
   * After:  players: ["abc", null]
   *
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    await client.withSession((session) =>
      session.withTransaction(async () => {
        // Find games where at least one player entry is an object (not yet migrated)
        const games = await db
          .collection("games")
          .find({ "players.id": { $exists: true } })
          .toArray();

        if (games.length === 0) return;

        await Promise.all(
          games.map((game) => {
            const normalizedPlayers = game.players.map((p) =>
              p && typeof p === "object" && p.id ? p.id : p,
            );

            return db.collection("games").updateOne(
              { _id: game._id },
              { $set: { players: normalizedPlayers } },
            );
          }),
        );
      }),
    );
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    // Cannot restore embedded user data from just IDs
  },
};

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
        const coll = db.collection("games");

        // Find games where at least one player entry is an object (not yet migrated)
        const games = await coll
          .find({ "players.id": { $exists: true } })
          .toArray();

        if (games.length > 0) {
          const ops = games.map((game) => ({
            updateOne: {
              filter: { _id: game._id },
              update: {
                $set: {
                  players: game.players.map((p) =>
                    p && typeof p === "object" && p.id ? p.id : p,
                  ),
                },
              },
            },
          }));
          await coll.bulkWrite(ops, { session });
        }

        // Add index for the new query pattern (filter by user ID string in players array)
        await coll.createIndex({ players: 1 }, { name: "game_players" });
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
        const coll = db.collection("games");

        // Drop the index added in up()
        await coll.dropIndex("game_players").catch(() => {});

        const games = await coll
          .find({ players: { $elemMatch: { $type: "string" } } })
          .toArray();

        if (games.length === 0) return;

        // Collect all unique player IDs
        const allIds = new Set();
        for (const game of games) {
          for (const p of game.players) {
            if (typeof p === "string") allIds.add(p);
          }
        }

        // Fetch user documents (best effort — data may differ from original)
        const { ObjectId } = require("mongodb");
        const users = await db
          .collection("users")
          .find({ _id: { $in: [...allIds].map((id) => new ObjectId(id)) } })
          .toArray();

        const usersMap = new Map();
        for (const u of users) {
          usersMap.set(u._id.toString(), {
            id: u._id.toString(),
            username: u.username,
            ranking: u.ranking,
          });
        }

        const ops = games.map((game) => ({
          updateOne: {
            filter: { _id: game._id },
            update: {
              $set: {
                players: game.players.map((p) => {
                  if (typeof p !== "string") return p;
                  return usersMap.get(p) ?? { id: p };
                }),
              },
            },
          },
        }));
        await coll.bulkWrite(ops, { session });
      }),
    );
  },
};

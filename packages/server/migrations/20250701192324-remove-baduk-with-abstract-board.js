const { ObjectId } = require("mongodb");

function mapBoardConfig(config) {
  switch (config.pattern) {
    case 1: {
      return { type: "grid", width: config.width, height: config.height };
    }
    case 2: {
      return { type: "polygonal", size: config.width };
    }
    case 3: {
      return {
        type: "circular",
        rings: config.height,
        nodesPerRing: config.width,
      };
    }
    case 4: {
      return { type: "trihexagonal", size: config.width };
    }
    case 5: {
      return { type: "sierpinsky", size: config.width };
    }
  }
}

module.exports = {
  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    client.startSession().withTransaction(async () => {
      var games = await db
        .collection("games")
        .find({ variant: "badukWithAbstractBoard" })
        .toArray();

      for (var game of games) {
        var result = await db.collection("games").findOneAndUpdate(
          { _id: new ObjectId(game._id) },
          {
            $set: {
              variant: "baduk",
              config: {
                komi: game.config.komi,
                board: mapBoardConfig(game.config),
              },
            },
          },
        );

        if (!result.lastErrorObject?.updatedExisting) {
          throw new Error(`migration failed for game ${game._id}`);
        }
      }
    });
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    // can't be undone
  },
};

const {
  makeGameObject,
  getOnlyMove,
  sanitizeConfig,
} = require("@govariants/shared");

/** Games updated per bulkWrite. */
const BATCH_SIZE = 500;

/** Replay a stored game and report the phase it ends in. */
function computePhase(game) {
  const game_obj = makeGameObject(
    game.variant,
    sanitizeConfig(game.variant, game.config),
  );
  for (const moves of game.moves ?? []) {
    const { player, move } = getOnlyMove(moves);
    game_obj.playMove(player, move);
  }
  return game_obj.phase;
}

module.exports = {
  /**
   * Store each game's `phase` ("play" or "gameover"), derived by replaying its
   * moves; games whose replay throws are left unset and logged.
   *
   * No transaction: the replay makes this long-running, and filtering on
   * `phase: { $exists: false }` already makes it re-runnable after a partial
   * failure.
   *
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async up(db, client) {
    const games = db.collection("games");
    let ops = [];
    let updated = 0;
    let skipped = 0;

    const flush = async () => {
      if (ops.length === 0) return;
      await games.bulkWrite(ops);
      updated += ops.length;
      ops = [];
    };

    for await (const game of games.find({ phase: { $exists: false } })) {
      let phase;
      try {
        phase = computePhase(game);
      } catch (e) {
        skipped++;
        console.warn(`Could not replay game ${game._id}: ${e}`);
        continue;
      }

      ops.push({
        updateOne: { filter: { _id: game._id }, update: { $set: { phase } } },
      });
      if (ops.length >= BATCH_SIZE) {
        await flush();
      }
    }
    await flush();

    console.log(`Set phase on ${updated} game(s).`);
    if (skipped > 0) {
      console.warn(`${skipped} game(s) left without a phase; see above.`);
    }
  },

  /**
   * @param db {import('mongodb').Db}
   * @param client {import('mongodb').MongoClient}
   * @returns {Promise<void>}
   */
  async down(db, client) {
    await db.collection("games").updateMany({}, { $unset: { phase: "" } });
  },
};

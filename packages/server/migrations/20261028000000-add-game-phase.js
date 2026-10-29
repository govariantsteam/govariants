const {
  makeGameObject,
  getOnlyMove,
  sanitizeConfig,
} = require("@govariants/shared");

/** Games updated per bulkWrite. */
const BATCH_SIZE = 500;

/**
 * Replay a stored game and report the phase it ends in.
 *
 * Mirrors the server's own read path, which replays the sanitized config.
 *
 * @param game {{ variant: string, config: object, moves?: object[] }}
 * @returns {"play" | "gameover"}
 */
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
   * Store each game's `phase` ("play" or "gameover").
   *
   * Finding out whether a game was finished previously meant replaying its
   * whole move list through the variant's game class, so no query could filter
   * on it — the timeout service loaded every clocked game at startup just to
   * throw the finished ones away.
   *
   * The backfilled value comes from doing that replay once, here. Games whose
   * replay throws (variants since removed, configs the current code rejects,
   * malformed move entries) are left without a `phase` and logged: they are
   * the same games the timeout service already skipped, and re-running this
   * migration will pick them up if their replay ever starts working again.
   *
   * `@govariants/shared` is required from its build output, so this has to run
   * after `yarn build`. The release phase orders it that way (see Procfile).
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

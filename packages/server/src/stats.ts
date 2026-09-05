import { Collection, Document } from "mongodb";
import {
  SiteStatsResponse,
  TimeControlType,
  TimeControlUsage,
  VariantStats,
  WeeklyGameCount,
} from "@govariants/shared";
import { getDb } from "./db";
import type { GameSchema } from "./games";

/** Number of weeks in the game-creation series. */
const WEEKS = 12;

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

function gamesCollection(): Collection<GameSchema> {
  return getDb().db().collection<GameSchema>("games");
}

function usersCollection(): Collection<Document> {
  return getDb().db().collection("users");
}

/** The session store configured in index.ts; connect-mongo's default collection. */
function sessionsCollection(): Collection<Document> {
  return getDb().db().collection("sessions");
}

const TIME_CONTROL_LABELS: Record<number, string> = {
  [TimeControlType.Invalid]: "Invalid",
  [TimeControlType.Absolute]: "Absolute",
  [TimeControlType.Fischer]: "Fischer",
  [TimeControlType.Simple]: "Simple",
  [TimeControlType.ByoYomi]: "Byo-Yomi",
  [TimeControlType.Canadian]: "Canadian",
};

function timeControlLabel(type: unknown): string {
  if (type === null || type === undefined) {
    // config.time_control is omitted for games played without a clock.
    return "Unlimited";
  }
  return TIME_CONTROL_LABELS[type as number] ?? `Unknown (${String(type)})`;
}

/** Midnight UTC on the Monday of the week containing `date`. */
function startOfIsoWeekUtc(date: Date): Date {
  const utcMidnight = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  // getUTCDay() is 0 for Sunday, which is 6 days after the week's Monday.
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  return new Date(utcMidnight - daysSinceMonday * DAY_MS);
}

/**
 * Zero-fills the weekly series so the chart always shows `WEEKS` buckets, even
 * for weeks in which no game was created.
 */
function buildWeeklySeries(
  counts: Map<number, number>,
  firstWeekStart: Date,
): WeeklyGameCount[] {
  return Array.from({ length: WEEKS }, (_, i) => {
    const weekStart = new Date(firstWeekStart.getTime() + i * WEEK_MS);
    return {
      weekStart: weekStart.toISOString(),
      games: counts.get(weekStart.getTime()) ?? 0,
    };
  });
}

type GamesFacet = {
  totals: Array<{
    total: number;
    createdLast7Days: number;
    createdLast30Days: number;
    seatsFilled: number;
    withMoves: number;
    totalMoves: number;
  }>;
  byVariant: Array<Omit<VariantStats, "variant"> & { _id: string }>;
  weekly: Array<{ _id: Date; games: number }>;
  byTimeControl: Array<{ _id: number | null; games: number }>;
};

type UsersFacet = {
  total: number;
  registered: number;
  guest: number;
  registeredLast30Days: number;
};

/**
 * Aggregate usage numbers for the admin dashboard.
 *
 * Everything here is derived from documents we already store, so no additional
 * tracking is involved and nothing user-identifying is returned. Games and users
 * have no created-at field; `_id` is an ObjectId, whose leading four bytes are a
 * second-resolution creation timestamp, so `$toDate: "$_id"` recovers it.
 *
 * Note that "finished" is not among the metrics: whether a game has ended is not
 * stored, and deriving it means replaying every game's moves through its variant.
 * `withMoves` is the cheap proxy for "this game actually got played".
 *
 * These pipelines scan the games and users collections in full. That is fine at
 * this site's scale, but it is the reason this is admin-only and computed on
 * request rather than on every page load.
 */
export async function getSiteStats(): Promise<SiteStatsResponse> {
  const now = new Date();
  const last7Days = new Date(now.getTime() - 7 * DAY_MS);
  const last30Days = new Date(now.getTime() - 30 * DAY_MS);
  const firstWeekStart = new Date(
    startOfIsoWeekUtc(now).getTime() - (WEEKS - 1) * WEEK_MS,
  );

  // A string condition is a field path (e.g. "$seatsFilled"); an object is an expression.
  const countIf = (condition: Document | string) => ({
    $sum: { $cond: [condition, 1, 0] },
  });
  const createdSince = (cutoff: Date) => ({ $gte: ["$createdAt", cutoff] });

  const [gamesFacet, usersFacet, activeSessions] = await Promise.all([
    gamesCollection()
      .aggregate<GamesFacet>([
        {
          $addFields: {
            createdAt: { $toDate: "$_id" },
            moveCount: { $size: { $ifNull: ["$moves", []] } },
            seatCount: { $size: { $ifNull: ["$players", []] } },
            emptySeatCount: {
              $size: {
                $filter: {
                  input: { $ifNull: ["$players", []] },
                  cond: { $eq: ["$$this", null] },
                },
              },
            },
          },
        },
        {
          $addFields: {
            seatsFilled: {
              $and: [
                { $gt: ["$seatCount", 0] },
                { $eq: ["$emptySeatCount", 0] },
              ],
            },
          },
        },
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  createdLast7Days: countIf(createdSince(last7Days)),
                  createdLast30Days: countIf(createdSince(last30Days)),
                  seatsFilled: countIf("$seatsFilled"),
                  withMoves: countIf({ $gt: ["$moveCount", 0] }),
                  totalMoves: { $sum: "$moveCount" },
                },
              },
            ],
            byVariant: [
              {
                $group: {
                  _id: "$variant",
                  games: { $sum: 1 },
                  gamesLast30Days: countIf(createdSince(last30Days)),
                  seatsFilled: countIf("$seatsFilled"),
                  withMoves: countIf({ $gt: ["$moveCount", 0] }),
                  totalMoves: { $sum: "$moveCount" },
                },
              },
              { $sort: { games: -1, _id: 1 } },
            ],
            weekly: [
              { $match: { createdAt: { $gte: firstWeekStart } } },
              {
                $group: {
                  _id: {
                    $dateTrunc: {
                      date: "$createdAt",
                      unit: "week",
                      startOfWeek: "monday",
                      timezone: "UTC",
                    },
                  },
                  games: { $sum: 1 },
                },
              },
            ],
            byTimeControl: [
              {
                $group: {
                  _id: { $ifNull: ["$config.time_control.type", null] },
                  games: { $sum: 1 },
                },
              },
              { $sort: { games: -1, _id: 1 } },
            ],
          },
        },
      ])
      .next(),
    usersCollection()
      .aggregate<UsersFacet>([
        { $addFields: { createdAt: { $toDate: "$_id" } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            registered: countIf({ $eq: ["$login_type", "persistent"] }),
            guest: countIf({ $eq: ["$login_type", "guest"] }),
            registeredLast30Days: countIf({
              $and: [
                { $eq: ["$login_type", "persistent"] },
                createdSince(last30Days),
              ],
            }),
          },
        },
      ])
      .next(),
    sessionsCollection().countDocuments({ expires: { $gt: now } }),
  ]);

  const totals = gamesFacet?.totals[0];
  const weeklyCounts = new Map(
    (gamesFacet?.weekly ?? []).map((bucket) => [
      bucket._id.getTime(),
      bucket.games,
    ]),
  );

  const timeControls: TimeControlUsage[] = (
    gamesFacet?.byTimeControl ?? []
  ).map((entry) => ({
    label: timeControlLabel(entry._id),
    games: entry.games,
  }));

  const variants: VariantStats[] = (gamesFacet?.byVariant ?? []).map(
    ({ _id, ...rest }) => ({ variant: _id, ...rest }),
  );

  return {
    generatedAt: now.toISOString(),
    games: {
      total: totals?.total ?? 0,
      createdLast7Days: totals?.createdLast7Days ?? 0,
      createdLast30Days: totals?.createdLast30Days ?? 0,
      seatsFilled: totals?.seatsFilled ?? 0,
      withMoves: totals?.withMoves ?? 0,
      totalMoves: totals?.totalMoves ?? 0,
    },
    users: {
      total: usersFacet?.total ?? 0,
      registered: usersFacet?.registered ?? 0,
      guest: usersFacet?.guest ?? 0,
      registeredLast30Days: usersFacet?.registeredLast30Days ?? 0,
      activeSessions,
    },
    variants,
    weeklyGames: buildWeeklySeries(weeklyCounts, firstWeekStart),
    timeControls,
  };
}

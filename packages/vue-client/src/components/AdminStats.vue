<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { SiteStatsResponse } from "@govariants/shared";
import * as requests from "../requests";

const stats = ref<SiteStatsResponse | null>(null);
const errorMessage = ref<string | null>(null);
const isLoading = ref(false);
const showWeeklyTable = ref(false);
const hoveredWeek = ref<number | null>(null);

const compactFormatter = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});
const plainFormatter = new Intl.NumberFormat();

/** Stat-tile values are compacted; table columns stay exact so they can be summed. */
function compact(value: number): string {
  return value < 10_000 ? plainFormatter.format(value) : compactFormatter.format(value);
}

function percentOf(value: number, total: number): string {
  if (!total) return "—";
  return `${Math.round((value / total) * 100)}%`;
}

function average(total: number, count: number): string {
  if (!count) return "—";
  return (total / count).toFixed(1);
}

function weekLabel(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

async function load() {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    stats.value = await requests.get("/admin/stats");
  } catch (error) {
    errorMessage.value = (error as Error).message;
  } finally {
    isLoading.value = false;
  }
}

onMounted(load);

const tiles = computed(() => {
  const s = stats.value;
  if (!s) return [];
  return [
    { label: "Games all time", value: compact(s.games.total) },
    { label: "Games last 30 days", value: compact(s.games.createdLast30Days) },
    { label: "Registered users", value: compact(s.users.registered) },
    { label: "Guest users", value: compact(s.users.guest) },
    { label: "Active sessions", value: compact(s.users.activeSessions) },
  ];
});

/** Rounds the axis maximum up to a clean number so gridline ticks read well. */
const weeklyMax = computed(() => {
  const peak = Math.max(0, ...(stats.value?.weeklyGames ?? []).map((w) => w.games));
  if (peak === 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(peak));
  return Math.ceil(peak / magnitude) * magnitude;
});

/**
 * Labelling all twelve buckets crowds the axis on narrow screens, so label the
 * most recent one and every third bucket back from it; the rest are carried by
 * the tooltip and the table view.
 */
function isLabelledWeek(index: number, length: number): boolean {
  return (length - 1 - index) % 3 === 0;
}

const funnel = computed(() => {
  const s = stats.value;
  if (!s) return [];
  const total = s.games.total;
  return [
    { stage: "Created", count: total, step: 1 },
    { stage: "All seats filled", count: s.games.seatsFilled, step: 2 },
    { stage: "At least one move", count: s.games.withMoves, step: 3 },
  ].map((row) => ({
    ...row,
    share: percentOf(row.count, total),
    width: total ? (row.count / total) * 100 : 0,
  }));
});

const timeControlMax = computed(() =>
  Math.max(1, ...(stats.value?.timeControls ?? []).map((t) => t.games)),
);

const generatedAt = computed(() =>
  stats.value ? new Date(stats.value.generatedAt).toLocaleString() : "",
);
</script>

<template>
  <section class="admin-stats">
    <div class="section-header">
      <h2>Site stats</h2>
      <button :disabled="isLoading" @click="load">
        {{ isLoading ? "Loading..." : "Refresh" }}
      </button>
    </div>

    <p v-if="errorMessage" class="error">Could not load stats: {{ errorMessage }}</p>
    <p v-else-if="!stats" class="muted">Loading…</p>

    <!-- Held at reduced opacity during a refetch so the layout never jumps. -->
    <div v-if="stats" class="stats-body" :class="{ refetching: isLoading }">
      <p class="muted generated-at">Computed {{ generatedAt }}</p>

      <ul class="tile-row">
        <li v-for="tile in tiles" :key="tile.label" class="tile">
          <span class="tile-label">{{ tile.label }}</span>
          <span class="tile-value">{{ tile.value }}</span>
        </li>
      </ul>

      <div class="chart-card">
        <div class="section-header">
          <div>
            <h3>Games created per week</h3>
            <p class="muted">Last 12 weeks by ISO week (UTC); the final week is still in progress.</p>
          </div>
          <button class="link-button" @click="showWeeklyTable = !showWeeklyTable">
            {{ showWeeklyTable ? "Show chart" : "Show table" }}
          </button>
        </div>

        <div v-if="showWeeklyTable" class="table-scroll">
        <table class="stats-table">
          <thead>
            <tr>
              <th scope="col">Week starting</th>
              <th scope="col" class="numeric">Games</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="week in stats.weeklyGames" :key="week.weekStart">
              <td>{{ weekLabel(week.weekStart) }}</td>
              <td class="numeric">{{ plainFormatter.format(week.games) }}</td>
            </tr>
          </tbody>
        </table>
        </div>

        <div v-else class="column-chart">
          <div class="y-axis">
            <span>{{ plainFormatter.format(weeklyMax) }}</span>
            <span>{{ plainFormatter.format(Math.round(weeklyMax / 2)) }}</span>
            <span>0</span>
          </div>
          <div class="plot">
            <div class="gridline" style="bottom: 100%"></div>
            <div class="gridline" style="bottom: 50%"></div>
            <div class="gridline baseline" style="bottom: 0"></div>
            <div
              v-for="(week, index) in stats.weeklyGames"
              :key="week.weekStart"
              class="column-slot"
              tabindex="0"
              :aria-label="`Week starting ${weekLabel(week.weekStart)}: ${week.games} games`"
              @mouseenter="hoveredWeek = index"
              @mouseleave="hoveredWeek = null"
              @focus="hoveredWeek = index"
              @blur="hoveredWeek = null"
            >
              <div
                class="column"
                :style="{ height: `${(week.games / weeklyMax) * 100}%` }"
              ></div>
              <div v-if="hoveredWeek === index" class="tooltip" role="tooltip">
                <strong>{{ plainFormatter.format(week.games) }}</strong>
                games<br />
                <span class="muted">week of {{ weekLabel(week.weekStart) }}</span>
              </div>
            </div>
          </div>
          <div class="x-axis">
            <span
              v-for="(week, index) in stats.weeklyGames"
              :key="week.weekStart"
              class="x-tick"
            >
              {{ isLabelledWeek(index, stats.weeklyGames.length) ? weekLabel(week.weekStart) : "" }}
            </span>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <h3>How far games get</h3>
        <p class="muted">
          Whether a game finished is not stored, so “at least one move” stands in for
          “actually played”.
        </p>
        <ul class="funnel">
          <li v-for="row in funnel" :key="row.stage">
            <div class="funnel-label">
              <span>{{ row.stage }}</span>
              <span class="muted">{{ row.share }}</span>
            </div>
            <div class="funnel-plot">
              <div
                class="funnel-bar"
                :class="`funnel-step-${row.step}`"
                :style="{ width: `${row.width}%` }"
              >
                <span class="funnel-value">{{ plainFormatter.format(row.count) }}</span>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <div class="chart-card">
        <h3>Variants</h3>
        <div class="table-scroll">
        <table class="stats-table">
          <thead>
            <tr>
              <th scope="col">Variant</th>
              <th scope="col" class="numeric">Games</th>
              <th scope="col" class="numeric">Last 30d</th>
              <th scope="col" class="numeric">Seats filled</th>
              <th scope="col" class="numeric">Played</th>
              <th scope="col" class="numeric">Avg moves</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="variant in stats.variants" :key="variant.variant">
              <td>{{ variant.variant }}</td>
              <td class="numeric">{{ plainFormatter.format(variant.games) }}</td>
              <td class="numeric">{{ plainFormatter.format(variant.gamesLast30Days) }}</td>
              <td class="numeric">{{ plainFormatter.format(variant.seatsFilled) }}</td>
              <td class="numeric">{{ plainFormatter.format(variant.withMoves) }}</td>
              <td class="numeric">{{ average(variant.totalMoves, variant.withMoves) }}</td>
            </tr>
            <tr v-if="!stats.variants.length">
              <td colspan="6" class="muted">No games yet.</td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      <div class="chart-card">
        <h3>Time controls</h3>
        <ul class="bar-list">
          <li v-for="entry in stats.timeControls" :key="entry.label">
            <span class="bar-list-label">{{ entry.label }}</span>
            <span class="bar-list-plot">
              <span
                class="bar-list-bar"
                :style="{ width: `${(entry.games / timeControlMax) * 100}%` }"
              >
                <span class="bar-list-value">{{ plainFormatter.format(entry.games) }}</span>
              </span>
            </span>
          </li>
          <li v-if="!stats.timeControls.length" class="muted">No games yet.</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
/*
 * Chart hues are steps of the site's brand green, picked per mode against that
 * mode's surface rather than flipped automatically, so marks keep a >= 3:1
 * contrast against the background in both themes.
 */
.admin-stats {
  margin-bottom: 2rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;

  --chart-accent: #00a86f;
  --funnel-step-1: #45c096;
  --funnel-step-2: #22a176;
  --funnel-step-3: #007d52;
}

@media (prefers-color-scheme: dark) {
  .admin-stats {
    --chart-accent: #1faf7a;
    --funnel-step-1: #0e6b4d;
    --funnel-step-2: #158a63;
    --funnel-step-3: #1faf7a;
  }
}

.admin-stats h2 {
  margin-top: 0;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.stats-body {
  transition: opacity 0.2s;
}

.stats-body.refetching {
  opacity: 0.6;
}

.generated-at {
  margin-bottom: 1rem;
}

.muted {
  color: var(--color-text);
  opacity: 0.7;
  font-size: 0.85em;
}

.error {
  color: var(--color-warn);
}

.tile-row {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.tile {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background-soft);
}

.tile-label {
  font-size: 0.8rem;
  opacity: 0.75;
}

.tile-value {
  font-size: 1.6rem;
  font-weight: 600;
  color: var(--color-heading);
  line-height: 1.2;
}

.chart-card {
  margin-top: 1.5rem;
}

.chart-card h3 {
  color: var(--color-heading);
  font-size: 1rem;
  font-weight: 600;
}

.column-chart {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-areas:
    "y-axis plot"
    ".      x-axis";
  gap: 0 0.5rem;
  margin-top: 0.75rem;
}

.y-axis {
  grid-area: y-axis;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 180px;
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
  opacity: 0.7;
  text-align: right;
  /* Nudge the tick text so each label sits on its gridline rather than below it. */
  margin-block: -0.55em;
}

.plot {
  grid-area: plot;
  position: relative;
  height: 180px;
  display: flex;
  align-items: flex-end;
  /* The 2px surface gap that separates adjacent columns. */
  gap: 2px;
}

.gridline {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px solid var(--color-border);
}

.gridline.baseline {
  border-top-color: var(--color-border-hover);
}

.column-slot {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  cursor: default;
}

.column-slot:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.column {
  width: 100%;
  max-width: 24px;
  min-height: 1px;
  background: var(--chart-accent);
  /* Rounded at the data end, square where it meets the baseline. */
  border-radius: 4px 4px 0 0;
}

.tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 0.4rem;
  padding: 0.35rem 0.6rem;
  white-space: nowrap;
  font-size: 0.8rem;
  line-height: 1.4;
  background: var(--color-background);
  border: 1px solid var(--color-border-hover);
  border-radius: 4px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.15);
  pointer-events: none;
  z-index: 1;
}

.x-axis {
  grid-area: x-axis;
  display: flex;
  gap: 2px;
  margin-top: 0.35rem;
}

.x-tick {
  flex: 1;
  text-align: center;
  font-size: 0.7rem;
  opacity: 0.7;
  white-space: nowrap;
}

.funnel {
  list-style: none;
  padding: 0;
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.funnel-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-bottom: 0.2rem;
}

/*
 * Bar widths are percentages of the plot, and the value label is taken out of
 * flow at the bar's end so it can never shorten the bar it labels. The reserved
 * padding is what keeps a full-width bar's label on screen.
 */
.funnel-plot,
.bar-list-plot {
  display: block;
  padding-right: 3.5rem;
}

.funnel-bar {
  position: relative;
  height: 16px;
  min-width: 2px;
  border-radius: 0 4px 4px 0;
}

.funnel-step-1 {
  background: var(--funnel-step-1);
}

.funnel-step-2 {
  background: var(--funnel-step-2);
}

.funnel-step-3 {
  background: var(--funnel-step-3);
}

.funnel-value,
.bar-list-value {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 0.5rem;
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* Six columns do not fit a phone; the table scrolls, the page does not. */
.table-scroll {
  overflow-x: auto;
}

.stats-table {
  width: 100%;
  min-width: 30rem;
  border-collapse: collapse;
  margin-top: 0.75rem;
  font-size: 0.9rem;
}

.stats-table th,
.stats-table td {
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}

.stats-table th {
  font-weight: 600;
  color: var(--color-heading);
}

.stats-table .numeric {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.bar-list {
  list-style: none;
  padding: 0;
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bar-list li {
  display: grid;
  grid-template-columns: 8rem 1fr;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.bar-list-bar {
  display: block;
  position: relative;
  height: 12px;
  min-width: 2px;
  background: var(--chart-accent);
  border-radius: 0 4px 4px 0;
}

.link-button {
  background: none;
  border: none;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0;
  text-decoration: underline;
}

@media (max-width: 540px) {
  .bar-list li {
    grid-template-columns: 5.5rem 1fr;
  }
}
</style>

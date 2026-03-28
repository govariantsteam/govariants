# Issue Burndown — April 2026

Prioritized 10 issues from the backlog. Ordered in batches that can be
worked on in parallel without file collisions.

## Collision Map

The main contention points:
- **`games.ts` + `api.ts`** — #370, #414, #366
- **`GameView.vue`** — #370, #414, #406
- **`server/tsconfig.json`** — #478 then #366 (sequential)
- **#479** (rename shared package) — 67+ files, conflicts with everything

## Batch 1

| Issue | Summary | Notes |
|-------|---------|-------|
| **#370** | User in seat duplicated & out of sync | Claims `games.ts`, `api.ts`, `GameView.vue` |
| **#301** | Server-side socket subscription validation | Isolated to `index.ts` / `socket_io.ts` |
| **#478** | Server tsconfig es6 → es2022+ | One-line change, unblocks #366 |

## Batch 2

| Issue | Summary | Notes |
|-------|---------|-------|
| **#366** | Turn on strict mode for server | Depends on #478. ~20 server files to fix |
| **#393** | DemoView exception handling | Isolated to `VariantDemoView.vue` |
| **#414** | Remove "repair game" code | Depends on #370 clearing `games.ts`/`api.ts` |

⚠️ #414 and #366 both touch `games.ts`/`api.ts` — coordinate or stagger.

## Batch 3

| Issue | Summary | Notes |
|-------|---------|-------|
| **#448** | Re-enable suppressed vue lint rules | ~23 scattered fixes. Check overlap with others |
| **#459** | Show captured stones count | Board components + game state display |
| **#406** | Show hidden info after game ends | `GameView.vue` + `VariantDemoView.vue` + boards |

⚠️ Check #448 violation list against #459/#406 files before starting.

## Batch 4

| Issue | Summary | Notes |
|-------|---------|-------|
| **#479** | Rename shared package + subpath imports | 67+ file rename. Use a script, not manual edits |

## Estimates

Each batch is roughly 1-3 days of agent work. Biggest wildcard is #366
(strict mode) since type errors can cascade. Total: ~10 working days.

# Variant Implementation Guide

This walkthrough shows how to add a new variant. Most of your code will live in a subdirectory of `packages/shared/src/variants` and can be written in vanilla JS.

## What you build
- A class that extends `AbstractGame` for rules and state.
- A `Variant` export that wires defaults, time handling, colors, and optional UI transforms/rules text.
- A registration entry in `packages/shared/src/variant_map.ts` so the server and client can find it.
- (optional) Custom UI components for config creation or boards.

## Quick start
1. From the repo root: `cd packages/shared && node scripts/create-new-variant.mjs my_new_variant` to scaffold `src/variants/my_new_variant.ts` and a matching test.
2. Fill out the generated class to implement rules and the `Variant` object.
3. Add the variant to `variant_map.ts` (keyed by the display name you want users to see).
4. Run tests: `cd packages/shared && yarn test` (or `yarn test my_new_variant.test.ts`).

## Implementing the game class

This is essentially the variant's ruleset.  It determines what to do when users submit a move.
The variant should throw an Error in the event of illegal moves or configs.

Implementation note: when a game is loaded from the db, the AbstractGame is instantiated, all moves up to this point are replayed into it, and the state is sent to the client.

- Extend `AbstractGame<Config, State>`.
- Required methods: `playMove`, `exportState`, `nextToPlay`, `numPlayers`. Call `super.increaseRound()` after each successful move so playback and timers stay in sync.
- Handle common specials: `resign` and `timeout` should end the game and set `result`.
- Validate config in the constructor (or `sanitizeConfig`) to reject huge boards or invalid inputs.

## The `Variant` object

This object contains global information about the variant.  This includes fields like the `AbstractGame` class itself, a plaintext description, etc.

Register the object in `packages/shared/src/variant_map.ts` so it shows up in `getVariantList()` and on the client.

## UI

### DefaultBoard

It should be possible to create a new variant without touching Vue code.  That's because most go variants can be represented by `DefaultBoard.vue`.  It takes a config and state.

- Config shape: `{ board: { type: 'grid', width, height } }` **or** a graph board config (see `BoardConfig` in `variants-shared`).
- State shape: `{ board, backgroundColor?, score_board? }` where `board` is a 2D array of `MulticolorStone | null` for grids, or a flat array for graphs.
- Each `MulticolorStone` needs a `colors: string[]` (e.g., `["black"]` or `["#222", "#eee"]`) and can optionally set `annotation`, `background_color`, or `disable_move`.

If your internal state doesn't match the schema expected by `DefaultBoard`, add `uiTransform` on the `Variant` to map it into this shape.

If your variant does not fit neatly into the DefaultBoard, you can write a custom Vue component.  See examples in packages/vue-client/src/board_map.ts.

## Game creation form

While not required, it's recommended to add a Vue component for creating your config.  See examples in `packages/vue-client/src/config_form_map.ts`.

If `config_form_map` does not have an entry for your variant, the client falls back to a JSON textarea using your `defaultConfig()`.

## Tests

Please add unit tests for your variant.  This helps with maintenance and refactors.

Place tests in `packages/shared/src/variants/__tests__`. Use the scaffolded test as a starting point and cover: winning conditions, invalid moves, pass/resign/timeout flows, and exportState shape.

## Example: Tic-Tac-Toe
See [#428](https://github.com/govariantsteam/govariants/pull/428) for a minimal sequential grid-based variant that:
- Validates moves on a 3x3 grid, declares wins/draws, and uses `uiTransform` to render on the default board.
- Registers itself in `variant_map.ts` without any client-side code changes.

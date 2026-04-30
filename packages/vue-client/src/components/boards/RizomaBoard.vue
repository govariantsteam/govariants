<script setup lang="ts">
import { computed } from "vue";
import MulticolorGridBoard from "./MulticolorGridBoard.vue";
import { Coordinate } from "@ogfcommunity/variants-shared";
import type {
  RizomaConfig,
  RizomaState,
  BoardScore,
} from "@ogfcommunity/variants-shared";
import type { MulticolorStone } from "@ogfcommunity/variants-shared";

const props = defineProps<{
  config: RizomaConfig;
  gamestate?: RizomaState;
}>();

const emit = defineEmits<{
  (e: "move", pos: string): void;
}>();

function cellToStone(cell: 0 | 1 | null): MulticolorStone | null {
  if (cell === 0) return { colors: ["black"] };
  if (cell === 1) return { colors: ["white"] };
  return null;
}

function cellToStoneDisabled(cell: 0 | 1 | null): MulticolorStone {
  if (cell === 0) return { colors: ["black"], disable_move: true };
  if (cell === 1) return { colors: ["white"], disable_move: true };
  return { colors: [], disable_move: true };
}

const boardData = computed(() =>
  props.config.boards.map((_, i) => {
    const raw = props.gamestate?.boards[i];
    if (!raw) return [];
    const isSource =
      props.gamestate !== undefined &&
      props.gamestate.pending_transfers > 0 &&
      props.gamestate.transfer_source_board === i;
    return raw.map((row) =>
      row.map(isSource ? cellToStoneDisabled : cellToStone),
    );
  }),
);

function positionClicked(boardIndex: number, pos: Coordinate) {
  emit("move", `${boardIndex}:${pos.toSgfRepr()}`);
}

function dynamicKomiLabel(index: number): string | null {
  const komi = props.config.boards[index].komi;
  if (!komi) return null;
  const first = props.gamestate?.first_move_on_board[index];
  if (first === null || first === undefined) return null;
  const recipient = first === 0 ? "White" : "Black";
  return `komi ${komi} → ${recipient}`;
}

function scoreLabel(bs: BoardScore): string {
  const bStr =
    bs.komi_recipient === 0 && bs.komi > 0
      ? `${bs.black_territory}+${bs.komi}`
      : `${bs.black_territory}`;
  const wStr =
    bs.komi_recipient === 1 && bs.komi > 0
      ? `${bs.white_territory}+${bs.komi}`
      : `${bs.white_territory}`;
  return `B: ${bStr}  |  W: ${wStr}`;
}
</script>

<template>
  <div class="rizoma-layout">
    <div
      v-for="(boardCfg, index) in props.config.boards"
      :key="index"
      class="rizoma-board-wrapper"
    >
      <div class="rizoma-board-label">
        Board {{ index + 1 }}
        <span
          v-if="
            props.gamestate &&
            props.gamestate.pending_transfers > 0 &&
            props.gamestate.transfer_source_board !== index
          "
          class="transfer-badge"
        >
          {{ props.gamestate.pending_transfers }} transfer{{
            props.gamestate.pending_transfers === 1 ? "" : "s"
          }}
          available here
        </span>
        <span
          v-if="
            props.gamestate &&
            props.gamestate.pending_transfers > 0 &&
            props.gamestate.transfer_source_board === index
          "
          class="transfer-source-badge"
        >
          capture source — play elsewhere
        </span>
      </div>

      <!-- during game: show who gets komi on this board once someone has played -->
      <div
        v-if="!props.gamestate?.board_scores && dynamicKomiLabel(index)"
        class="board-info-label"
      >
        {{ dynamicKomiLabel(index) }}
      </div>

      <!-- after game: per-board score breakdown -->
      <div
        v-if="props.gamestate?.board_scores?.[index]"
        class="board-score-label"
      >
        {{ scoreLabel(props.gamestate.board_scores[index]) }}
      </div>

      <MulticolorGridBoard
        :board="boardData[index]"
        :board-dimensions="boardCfg"
        @click="(pos: Coordinate) => positionClicked(index, pos)"
      />
    </div>
  </div>

  <!-- global komi display -->
  <div v-if="props.config.global_komi" class="global-komi-label">
    Global komi {{ props.config.global_komi }} → White
  </div>
</template>

<style scoped>
.rizoma-layout {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
}

.rizoma-board-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.rizoma-board-label {
  color: white;
  font-size: 15px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 10px;
}

.transfer-badge {
  background: #f0a500;
  color: #1a1a1a;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 12px;
}

.transfer-source-badge {
  background: #555;
  color: #ccc;
  font-size: 12px;
  font-weight: normal;
  padding: 2px 8px;
  border-radius: 12px;
  font-style: italic;
}

.board-info-label {
  color: #aaa;
  font-size: 12px;
  font-style: italic;
}

.board-score-label {
  color: #e0e0e0;
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 0.03em;
}

.global-komi-label {
  text-align: center;
  color: #aaa;
  font-size: 12px;
  font-style: italic;
  margin-top: 8px;
}

:deep(.board) {
  width: 280px;
  height: 280px;
}
</style>

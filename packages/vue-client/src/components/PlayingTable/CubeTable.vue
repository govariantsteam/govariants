<script setup lang="ts">
import { ref, computed } from "vue";
import CubeBoard from "../boards/CubeBoard.vue";
import type {
  CubeBadukConfig,
  DefaultBoardState,
} from "@ogfcommunity/variants-shared";

defineProps<{
  gamestate: DefaultBoardState;
  config: CubeBadukConfig;
  displayed_round: number;
}>();

const emit = defineEmits<{
  (e: "move", move: string): void;
}>();

function move(move: string) {
  emit("move", move);
}

// Slider value from 0-100 (for easier UI)
const sliderValue = ref(50);
const debugGraphics = ref(false);

// Map slider value to power with linear scale 2.0 to 10.0
// At 100, we'll render a true cube instead of squircle
const power = computed(() => {
  return 2 + (sliderValue.value / 100) * 8;
});

const displayPower = computed(() => {
  if (sliderValue.value === 100) return "Cube";
  return power.value.toFixed(1);
});
</script>

<template>
  <div class="cube-table">
    <CubeBoard
      :gamestate="$props.gamestate"
      :config="$props.config"
      :power="power"
      :debug-graphics="debugGraphics"
      v-on:move="move"
    />
    <div class="controls">
      <label for="power-slider" class="control-label">
        Board Curvature: {{ displayPower }}
      </label>
      <input
        id="power-slider"
        v-model.number="sliderValue"
        type="range"
        min="0"
        max="100"
        step="1"
        class="power-slider"
      />
      <div class="control-hints">
        <span>Spherical (2.0)</span>
        <span>Perfect Cube</span>
      </div>
      <div class="checkbox-control">
        <label>
          <input type="checkbox" v-model="debugGraphics" />
          Debug Graphics
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cube-table {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.control-label {
  font-weight: 500;
  color: #ddd;
  font-size: 0.95rem;
}

.power-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, #4a9eff, #ff6b6b);
  outline: none;
  opacity: 0.8;
  transition: opacity 0.2s;
  cursor: pointer;
}

.power-slider:hover {
  opacity: 1;
}

.power-slider::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.power-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.control-hints {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #999;
}

.checkbox-control {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.checkbox-control label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #999;
  cursor: pointer;
  user-select: none;
}

.checkbox-control input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
}

.checkbox-control label:hover {
  color: #ddd;
}
</style>

<script setup lang="ts">
import { reactive, ref } from "vue";
import TaegeukStone from "../components/TaegeukStone.vue";
import MulticolorGridBoard from "../components/boards/MulticolorGridBoard.vue";
import type { Coordinate } from "@ogfcommunity/variants-shared";
import SocketTest from "../components/SocketTest.vue";

// https://sashamaps.net/docs/resources/20-colors/
const distinct_colors = [
  "#e6194B",
  "#3cb44b",
  "#ffe119",
  "#4363d8",
  "#f58231",
  "#911eb4",
  "#42d4f4",
  "#f032e6",
  "#bfef45",
  "#fabed4",
  "#469990",
  "#dcbeff",
  "#9A6324",
  "#fffac8",
  "#800000",
  "#aaffc3",
  "#808000",
  "#ffd8b1",
  "#000075",
  "#a9a9a9",
  "#ffffff",
  "#000000",
];

const num_colors = ref(1);
const r = ref(300);
const cx = ref(0);
const cy = ref(0);

const current_color = ref("blue");

const board_state: { colors: string[] }[][] = reactive([
  [{ colors: [] }, { colors: [] }, { colors: [] }],
  [{ colors: [] }, { colors: [] }, { colors: [] }],
  [{ colors: [] }, { colors: [] }, { colors: [] }],
  [{ colors: [] }, { colors: [] }, { colors: [] }],
]);

function update_board_state(pos: Coordinate) {
  board_state[pos.y][pos.x].colors.push(current_color.value);
}
</script>

<template>
  <main>
    <div class="grid-page-layout">
      <div>
        <h2>Page to test unused components</h2>
        <SocketTest />
        <MulticolorGridBoard
          :board_dimensions="{ width: 3, height: 4 }"
          :board="board_state"
          @click="update_board_state"
        />
        <select v-model="current_color" name="colors">
          <option value="blue">Blue</option>
          <option value="red">Red</option>
          <option value="green">Green</option>
          <option value="yellow">Yellow</option>
        </select>
        <svg height="600" width="600" viewBox="-300 -300 600 600">
          <TaegeukStone
            :r="r"
            :cx="cx"
            :cy="cy"
            :colors="distinct_colors.slice(0, num_colors)"
          />
        </svg>
        <div>
          <label>Number of colors (1-20):</label>
          <input v-model="num_colors" type="number" />
        </div>
        <div>
          <label>Radius:</label>
          <input v-model="r" type="number" />
        </div>
        <div>
          <label>cx:</label>
          <input v-model="cx" type="number" />
          <label>cy:</label>
          <input v-model="cy" type="number" />
        </div>
      </div>
    </div>
  </main>
</template>

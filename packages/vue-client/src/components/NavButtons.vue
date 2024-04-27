<script setup lang="ts">
const props = defineProps<{ gameRound?: number }>();

const round = defineModel<number | null>();

const navigateRounds = (offset: number): void => {
  if (props.gameRound === undefined) {
    // game not initialised
    return;
  }

  const after_offset = (round.value ?? props.gameRound) + offset;
  const round_in_range = Math.min(props.gameRound, Math.max(0, after_offset));

  round.value = round_in_range === props.gameRound ? null : round_in_range;
};
</script>

<template>
  <div class="round-nav-buttons">
    <div class="left-container">
      <button @click="() => navigateRounds(-(props.gameRound ?? 0))">
        &lt;&lt;&lt;
      </button>
      <button @click="() => navigateRounds(-10)">&lt;&lt;</button>
      <button @click="() => navigateRounds(-1)">&lt;</button>
    </div>
    <span>
      {{ round ?? props.gameRound ?? "" }} / {{ props.gameRound ?? "" }}</span
    >
    <div class="right-container">
      <button @click="() => navigateRounds(1)">></button>
      <button @click="() => navigateRounds(10)">>></button>
      <button @click="() => navigateRounds(props.gameRound ?? 0)">>>></button>
    </div>
  </div>
</template>

<style scoped>
.round-nav-buttons {
  height: fit-content;
  display: flex;
  flex-direction: row;
  width: inherit;
  max-width: var(--board-side-length);
  justify-content: space-between;
  .left-container {
    display: flex;
    flex-direction: row;
    gap: 10px;
  }
  .right-container {
    display: flex;
    flex-direction: row;
    gap: 10px;
  }
}
</style>

<script setup lang="ts">
import {
  uiTransform,
  type GameInitialResponse,
} from "@govariants/shared";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { getBoard } from "@/board_map";

const props = defineProps<{ game: GameInitialResponse }>();

const transformedGameData = computed(() =>
  uiTransform(props.game.variant, props.game.config, props.game.state),
);

const variantGameView = computed(() => getBoard(props.game.variant));

// Boards can be expensive to mount (e.g. CubeBoard creates a WebGL context,
// and browsers cap how many can be live at once), so only mount while the
// item is near the viewport, and unmount again once it scrolls away.
const eventBlockerRef = ref<HTMLElement>();
const isVisible = ref(false);
let observer: IntersectionObserver | undefined;

onMounted(() => {
  if (!eventBlockerRef.value) return;
  observer = new IntersectionObserver(
    ([entry]) => {
      isVisible.value = entry.isIntersecting;
    },
    { rootMargin: "150px 0px" },
  );
  observer.observe(eventBlockerRef.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>

<template>
  <li class="game-list-item">
    <RouterLink :to="{ name: 'game', params: { gameId: props.game.id } }">
      <div ref="eventBlockerRef" class="event-blocker">
        <component
          :is="variantGameView"
          v-if="variantGameView && isVisible"
          :gamestate="transformedGameData.gamestate"
          :config="transformedGameData.config"
        />
      </div>
      <div class="variant-text">{{ props.game.variant }}</div>
    </RouterLink>
  </li>
</template>

<style scoped>
li.game-list-item {
  padding: 10px;
  width: 50%;
  list-style-type: none;
  display: inline-block;
  .event-blocker {
    aspect-ratio: 1 / 1;
    pointer-events: none;
  }
}

.variant-text {
  font-variant: small-caps;
  color: gray;
  text-align: right;
  padding: 0;
  margin-top: -15px;
}

a {
  text-decoration: none;
}

.board {
  width: 100%;
  padding: 0;
}
</style>

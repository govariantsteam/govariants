import { onUnmounted, ref, Ref } from "vue";

export type ReStartableInterval = {
  restart: (callback: () => void, interval_ms: number) => void;
  stop: () => void;
};

export function useInterval(): ReStartableInterval {
  const intervalIndex: Ref<number | null> = ref(null);

  function stop(): void {
    if (intervalIndex.value !== null) {
      clearInterval(intervalIndex.value);
      intervalIndex.value = null;
    }
  }

  function restart(callback: () => void, interval_ms: number): void {
    stop();
    intervalIndex.value = window.setInterval(callback, interval_ms);
  }

  onUnmounted(stop);

  return { restart: restart, stop: stop };
}

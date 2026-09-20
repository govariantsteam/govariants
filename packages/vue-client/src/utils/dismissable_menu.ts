import { onUnmounted, ref, Ref } from "vue";

export type DismissableMenu = {
  isOpen: Ref<boolean>;
  toggle: (event: MouseEvent) => void;
  close: () => void;
};

export function useDismissableMenu(): DismissableMenu {
  const isOpen = ref(false);

  function close(): void {
    isOpen.value = false;
    document.removeEventListener("click", close);
    document.removeEventListener("keydown", onKeydown);
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      close();
    }
  }

  function toggle(event: MouseEvent): void {
    if (isOpen.value) {
      close();
      return;
    }
    // Clicks on the items are left to bubble so that the listener below closes
    // the menu behind them, which means this one has to be held back.
    event.stopPropagation();
    isOpen.value = true;
    document.addEventListener("click", close);
    document.addEventListener("keydown", onKeydown);
  }

  onUnmounted(close);

  return { isOpen, toggle, close };
}

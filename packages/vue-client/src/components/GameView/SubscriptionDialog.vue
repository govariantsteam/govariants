<script setup lang="ts">
import { type NotificationType } from "@ogfcommunity/variants-shared";
import { createApp, effect, ref, watch } from "vue";
import Swal from "sweetalert2";
import * as requests from "@/requests";
import SubscriptionDialogContent from "./SubscriptionDialogContent.vue";

const props = defineProps<{
  gameId: string;
  subscription: NotificationType[];
  isOpen: boolean;
}>();

const emit = defineEmits<{ (e: "close"): void }>();

const notificationOptions = ref<Array<number>>([...props.subscription]);

effect(() => {
  notificationOptions.value = [...props.subscription];
});

async function subscribe(types: number[]): Promise<void> {
  await requests.post(`/game/${props.gameId}/subscribe`, {
    notificationTypes: types,
  });
}

async function openDialog() {
  const selection = ref<number[]>([...notificationOptions.value]);

  const container = document.createElement("div");

  const app = createApp(SubscriptionDialogContent, {
    modelValue: selection.value,
    "onUpdate:modelValue": (v: number[]) => {
      selection.value = v;
    },
  });

  app.mount(container);

  const result = await Swal.fire({
    title: "Notification options",
    html: container,
    showCancelButton: true,
    confirmButtonText: "Save",
    didDestroy: () => app.unmount(),
    preConfirm: () => selection.value,
  });

  if (result.isConfirmed) {
    notificationOptions.value = result.value;
    await subscribe(notificationOptions.value);
  }

  emit("close");
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) openDialog();
  },
);
</script>

<!-- No template, we embed content to SweetAlert which renders outside Vue -->

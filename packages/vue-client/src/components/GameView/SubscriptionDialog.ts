import { type NotificationType } from "@ogfcommunity/variants-shared";
import { createApp, ref } from "vue";
import Swal from "sweetalert2";
import * as requests from "@/requests";
import SubscriptionDialogContent from "./SubscriptionDialogContent.vue";

type SubscriptionDialogProps = {
  gameId: string;
  subscription: NotificationType[];
};

async function subscribe(gameId: string, types: number[]): Promise<void> {
  await requests.post(`/game/${gameId}/subscribe`, {
    notificationTypes: types,
  });
}

export async function openSubscriptionDialog(
  props: SubscriptionDialogProps,
): Promise<NotificationType[]> {
  const selection = ref<NotificationType[]>([...props.subscription]);

  const container = document.createElement("div");

  const app = createApp(SubscriptionDialogContent, {
    modelValue: selection.value,
    "onUpdate:modelValue": (v: NotificationType[]) => {
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
    await subscribe(props.gameId, selection.value);
    return selection.value;
  }

  return props.subscription;
}

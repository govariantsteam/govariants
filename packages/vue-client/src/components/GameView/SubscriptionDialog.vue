<script setup lang="ts">
import { NotificationType } from "@ogfcommunity/variants-shared";
import { effect, Ref, ref, watch } from "vue";
import * as requests from "@/requests";

const props = defineProps<{
  gameId: string;
  subscription: NotificationType[];
  isOpen: boolean;
}>();

const openState = ref(props.isOpen);
watch(props, () => (openState.value = props.isOpen));
watch(openState, () => {
  if (!openState.value) emit("close");
});

const emit = defineEmits<{ (e: "close"): void }>();

const notificationOptions: Ref<Array<string | number>> = ref([
  ...props.subscription,
]);

function resetNotificationOptions(): void {
  notificationOptions.value = [...props.subscription];
}

effect(() => (notificationOptions.value = props.subscription));

async function subscribe(
  notificationTypes: Array<string | number>,
): Promise<void> {
  await requests.post(`/game/${props.gameId}/subscribe`, {
    notificationTypes: notificationTypes.map((x) => Number(x)),
  });
}
</script>

<template>
  <v-dialog v-model="openState" width="fit-content">
    <v-card
      title="Notification options"
      v-bind:class="'notifications-dialog-content'"
    >
      <span>
        <label for="game_end_checkbox">game end</label>
        <input
          id="game_end_checkbox"
          type="checkbox"
          v-model="notificationOptions"
          value="1"
        />
      </span>
      <span>
        <label for="new_round_checkbox">new round</label>
        <input
          id="new_round_checkbox"
          type="checkbox"
          v-model="notificationOptions"
          value="2"
        />
      </span>

      <span>
        <label for="my_move_checkbox">my move</label>
        <input
          id="my_move_checkbox"
          type="checkbox"
          v-model="notificationOptions"
          value="3"
        />
      </span>

      <span>
        <label for="seat_change_checkbox">seat change</label>
        <input
          id="seat_change_checkbox"
          type="checkbox"
          v-model="notificationOptions"
          value="4"
        />
      </span>

      <v-card-actions>
        <button
          @click="
            subscribe(notificationOptions);
            openState = false;
          "
        >
          save
        </button>
        <button
          @click="
            resetNotificationOptions();
            openState = false;
          "
        >
          cancel
        </button>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
span {
  display: flex;
  justify-content: right;
  gap: 2rem;
}
label,
input {
  width: fit-content;
  display: inline-block;
}
.notifications-dialog-content {
  padding: 16px 48px;
}
</style>

<script setup lang="ts">
import { NotificationType } from "@ogfcommunity/variants-shared";
import { effect, Ref, ref } from "vue";
import * as requests from "@/requests";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faBell);

const props = defineProps<{
  gameId: string;
  subscription: NotificationType[];
}>();

const notificationOptions: Ref<Array<string | number>> = ref(
  props.subscription,
);

effect(() => (notificationOptions.value = props.subscription));

async function subscribe(
  notificationTypes: Array<string | number>,
  isOpen: Ref<boolean>,
): Promise<void> {
  await requests.post(`/game/${props.gameId}/subscribe`, {
    notificationTypes: notificationTypes.map((x) => Number(x)),
  });
  isOpen.value = false;
}
</script>

<template>
  <v-dialog width="fit-content">
    <template v-slot:activator="{ props }">
      <button v-bind="props" v-bind:class="'notification-options-button'">
        <font-awesome-icon icon="fa-solid fa-bell" class="icon" />
      </button>
    </template>

    <template v-slot:default="{ isActive }">
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
          <button @click="subscribe(notificationOptions, isActive)">
            save
          </button>
          <button @click="isActive.value = false">cancel</button>
        </v-card-actions>
      </v-card>
    </template>
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
.notification-options-button {
  width: fit-content;
  /*border-radius: 2em;*/
}
.notifications-dialog-content {
  padding: 16px 48px;
}
</style>

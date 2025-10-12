<script setup lang="ts">
import { NotificationType } from "@ogfcommunity/variants-shared";
import { Ref, ref } from "vue";
import "vuetify/styles";
import * as requests from "@/requests";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faBell);

const props = defineProps<{ gameId: string }>();

const notificationOptions = ref([]);
// const isActive = ref(false);

async function subscribe(
  notificationTypes: NotificationType[],
  isOpen: Ref<boolean>,
): Promise<void> {
  await requests.post(`/game/${props.gameId}/subscribe`, {
    notificationTypes: notificationTypes,
  });
  isOpen.value = false;
}
</script>

<template>
  <v-dialog width="fit-content">
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" v-bind:class="'notification-options-button'">
        <font-awesome-icon icon="fa-solid fa-bell" class="icon" />
      </v-btn>
    </template>

    <template v-slot:default="{ isActive }">
      <v-card
        title="Notification options"
        v-bind:class="'notifications-dialog-content'"
      >
        {{ isActive }}
        <v-switch
          label="game end"
          v-model="notificationOptions"
          value="1"
          color="primary"
        ></v-switch>
        <v-switch
          label="new round"
          v-model="notificationOptions"
          value="2"
          color="primary"
        ></v-switch>
        <v-switch
          label="my move"
          v-model="notificationOptions"
          value="3"
          color="primary"
        ></v-switch>
        <v-switch
          label="seat change"
          v-model="notificationOptions"
          value="4"
          color="primary"
        ></v-switch>

        <v-card-actions>
          <v-btn
            text="save"
            @click="subscribe(notificationOptions, isActive)"
          />
          <v-btn text="cancel" @click="isActive.value = false" />
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<style scoped>
.notification-options-button {
  width: fit-content;
  border-radius: 2em;
}
.notifications-dialog-content {
  padding: 16px 48px;
}
</style>

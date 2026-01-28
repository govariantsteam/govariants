<script setup lang="ts">
import { effect, Ref, ref, watchEffect } from "vue";
import * as requests from "@/requests";
import { useCurrentUser, useStore } from "@/stores/user";
import {
  GameNotification,
  isErrorResult,
  Notifications,
  NotificationsResponse,
} from "@ogfcommunity/variants-shared";
import { setNotificationsCount } from "@/stores/notifications";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faCircleCheck,
  faTrash,
  faGear,
  faBell,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import GameListItem from "@/components/GameListItem.vue";
import GameListItemFallback from "@/components/GameListItemFallback.vue";
import SubscriptionDialog from "@/components/GameView/SubscriptionDialog.vue";

library.add(faCircleCheck, faTrash, faGear, faBell);

const notificationGroups: Ref<NotificationsResponse[] | null> = ref(null);
const store = useStore();
const user = useCurrentUser();
const isDialogOpen = ref(false);

effect(() =>
  setNotificationsCount(
    notificationGroups.value
      ?.flatMap((x) => x.notifications)
      .filter((notification) => !notification.read).length ?? 0,
  ),
);

async function load(): Promise<void> {
  await requests
    .get("/notifications")
    .then((result) => (notificationGroups.value = result))
    .catch(alert);
}

watchEffect(async () => {
  if (user.value && store.csrf_token) {
    await load();
  } else {
    notificationGroups.value = null;
  }
});

function renderNotification(notification: GameNotification): string {
  switch (notification.type) {
    case Notifications.gameEnd: {
      return `Game has ended with result ${notification.params.result}.`;
    }
    case Notifications.myMove: {
      return `It's your move in round ${notification.params.round}.`;
    }
    case Notifications.newRound: {
      return `Round ${notification.params.round} has started.`;
    }
    case Notifications.seatChange: {
      return `${notification.params.user} has ${
        notification.params.didTakeSeat ? "taken" : "left"
      } seat ${notification.params.seat}.`;
    }
  }
}

async function markAsRead(gameId: string): Promise<unknown> {
  return requests
    .post(`/notifications/${gameId}/mark-as-read`)
    .catch(alert)
    .then(load);
}

async function clear(gameId: string): Promise<unknown> {
  return requests
    .post(`/notifications/${gameId}/clear`)
    .catch(alert)
    .then(load);
}
</script>

<template>
  <div class="notifications-page">
    <div
      class="game-notifications-container"
      v-for="{ gameId, notifications, gameState } in notificationGroups"
      :key="gameId"
    >
      <div class="board-container">
        <template v-if="isErrorResult(gameState)">
          <GameListItemFallback
            :error="gameState.errorMessage"
            :variant="gameState.variant"
            :game-id="gameState.id"
          />
        </template>
        <template v-else>
          <GameListItem :game="gameState" />
        </template>
        <div v-for="(notification, index) in notifications" :key="index">
          <strong v-if="!notification.read" aria-label="unread">
            {{ renderNotification(notification) }}
          </strong>
          <span v-else aria-label="read">
            {{ renderNotification(notification) }}
          </span>
        </div>
      </div>
      <div class="actions-container">
        <button
          class="icon-button success-color"
          aria-label="mark as read"
          v-on:click="markAsRead(gameId)"
        >
          <FontAwesomeIcon icon="fa-solid fa-circle-check" />
        </button>
        <button
          class="icon-button alert-color"
          aria-label="clear"
          v-on:click="clear(gameId)"
        >
          <FontAwesomeIcon icon="fa-solid fa-trash" />
        </button>
        <button
          class="icon-button grey-color"
          :disabled="!user"
          v-on:click="isDialogOpen = true"
        >
          <FontAwesomeIcon icon="fa-solid fa-gear" />
        </button>
        <SubscriptionDialog
          v-if="!isErrorResult(gameState)"
          :gameId="gameId"
          :subscription="gameState.subscription ?? []"
          :is-open="isDialogOpen"
          v-on:close="isDialogOpen = false"
        ></SubscriptionDialog>
      </div>
    </div>
    <p v-if="user === null">Please log in to view your users notifications.</p>
    <p v-if="notificationGroups?.length === 0">
      You have no notifications currently. Subscribe to a games notifications by
      clicking on
      <FontAwesomeIcon icon="fa-solid fa-bell" /> .
    </p>
  </div>
</template>

<style scoped>
.notifications-page {
  padding: 2em;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}
.game-notifications-container {
  margin: 20px;
  padding: 5px;
  box-shadow: 0 0 5px black;
  display: flex;
  flex-direction: row;
  width: fit-content;
}
li.game-list-item {
  width: 300px;
  &:hover {
    filter: contrast(85%);
  }
}
.actions-container {
  width: fit-content;
  display: flex;
  flex-direction: column;
}
.icon-button {
  font-size: 1.5em;
}
strong {
  font-weight: 800;
}
.success-color {
  color: rgba(0, 128, 0, 0.7);
}
.alert-color {
  color: rgba(255, 0, 0, 0.7);
}
.grey-color {
  color: rgba(128, 128, 128, 0.7);
}
</style>

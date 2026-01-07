<script setup lang="ts">
import { computed, effect, Ref, ref, watchEffect } from "vue";
import * as requests from "@/requests";
import { useCurrentUser, useStore } from "@/stores/user";
import {
  GameNotification,
  groupBy,
  Notifications,
} from "@ogfcommunity/variants-shared";
import { setNotificationsCount } from "@/stores/notifications";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faCircleCheck,
  faEyeSlash,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faCircleCheck, faTrash, faEyeSlash);

const notifications: Ref<GameNotification[] | null> = ref(null);
const store = useStore();
const user = useCurrentUser();
const groupedNotifications = computed(() => {
  const notificationsArray = notifications.value;
  if (notificationsArray == null) {
    return null;
  }

  return groupBy(notificationsArray, (n) => n.gameId);
});

effect(() =>
  setNotificationsCount(
    notifications.value?.filter((notification) => !notification.read).length ??
      0,
  ),
);

async function load(): Promise<void> {
  await requests
    .get("/notifications")
    .then((result) => (notifications.value = result))
    .catch(alert);
}

watchEffect(async () => {
  if (user.value && store.csrf_token) {
    await load();
  } else {
    notifications.value = null;
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
  <main>
    <div>
      <div
        class="card"
        v-for="[gameId, gameNotifications] in groupedNotifications"
        :key="gameId"
      >
        <RouterLink :to="`/game/${gameId}`">game-{{ gameId }}</RouterLink>
        <div v-for="(notification, index) in gameNotifications" :key="index">
          <strong v-if="!notification.read" aria-label="unread">
            {{ renderNotification(notification) }}
          </strong>
          <span v-else aria-label="read">
            {{ renderNotification(notification) }}
          </span>
        </div>
        <button aria-label="mark as read" v-on:click="markAsRead(gameId)">
          <FontAwesomeIcon icon="fa-solid fa-circle-check" />
        </button>
        <button aria-label="clear" v-on:click="clear(gameId)">
          <FontAwesomeIcon icon="fa-solid fa-trash" />
        </button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.card {
  margin: 20px;
  padding: 5px;
  box-shadow: 0 0 5px black;
  width: fit-content;
}
strong {
  font-weight: 800;
}
</style>

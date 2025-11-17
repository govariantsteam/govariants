<script setup lang="ts">
import { computed, Ref, ref, watchEffect } from "vue";
import * as requests from "@/requests";
import { useCurrentUser, useStore } from "@/stores/user";
import {
  GameNotification,
  groupBy,
  Notifications,
} from "@ogfcommunity/variants-shared";

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

watchEffect(async () => {
  if (user.value && store.csrf_token) {
    await requests
      .get("/notifications")
      .then((result) => (notifications.value = result))
      .catch(alert);
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
          {{ renderNotification(notification) }}
        </div>
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
</style>

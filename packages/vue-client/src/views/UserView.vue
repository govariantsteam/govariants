<script setup lang="ts">
import { UserResponse, UserRole } from "@ogfcommunity/variants-shared";
import { ref, watchEffect } from "vue";
import * as requests from "../requests";

const props = defineProps<{ userId: string }>();

const user = ref<UserResponse>();
const err = ref<string>();

watchEffect(async () => {
  try {
    user.value = await requests.get(`/users/${props.userId}`);
  } catch (e) {
    err.value = e as string;
  }
});

function roleToUIString(role: UserRole) {
  switch (role) {
    case "admin":
      return "Administrator";
  }
  return role;
}
</script>

<template>
  <main>
    <div class="grid-page-layout">
      <div v-if="user">
        <div v-if="user.login_type === 'guest'">Guest User</div>
        <div v-else>{{ user.username }}</div>
        <div v-if="user.role">{{ roleToUIString(user.role) }}</div>
      </div>
      <div v-if="err">{{ err }}</div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { UserResponse, UserRole } from "@ogfcommunity/variants-shared";
import { ref, watchEffect } from "vue";
import * as requests from "../requests";
import { useCurrentUser } from "@/stores/user";

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
const loggedInUser = useCurrentUser();

function setRole(role: UserRole) {
  watchEffect(async () => {
    try {
      user.value = await requests.put(`/users/${props.userId}/role`, { role });
    } catch (e) {
      alert(e);
    }
  });
}
</script>

<template>
  <main>
    <div class="grid-page-layout">
      <div v-if="user">
        <div v-if="user.login_type === 'guest'">Guest User</div>
        <div v-else>{{ user.username }}</div>
        <div v-if="user.role">{{ user.role }}</div>
        <div v-if="loggedInUser?.role === 'admin'">
          <button v-if="user.role !== 'admin'" @click="setRole('admin')">
            Make Admin
          </button>
        </div>
      </div>
      <div v-if="err">{{ err }}</div>
    </div>
  </main>
</template>

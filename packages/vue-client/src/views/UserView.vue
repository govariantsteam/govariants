<script setup lang="ts">
import { UserResponse, UserRole } from "@ogfcommunity/variants-shared";
import { ref, watchEffect } from "vue";
import * as requests from "../requests";
import { useCurrentUser } from "@/stores/user";
import Swal from "sweetalert2";
import router from "@/router";

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
  requests
    .put(`/users/${props.userId}/role`, { role })
    .then(() => (user.value = user.value ? { ...user.value, role } : undefined))
    .catch(alert);
}

async function launchDeleteUserDialog() {
  if (!user.value) {
    Swal.fire({ icon: "error", text: "User is undefined!" });
    return;
  }

  const userToDelete = user.value;
  const { value: nameForVerification } = await Swal.fire({
    title: "Delete User",
    text: `Are you sure you want to delete user '${userToDelete.username}'`,
    input: "text",
    inputPlaceholder: "To confirm, type the username here",
    showCancelButton: true,
  });

  if (nameForVerification !== userToDelete.username) {
    Swal.fire({
      icon: "error",
      text: "Name did not match!",
    });
  } else {
    try {
      await requests.del(`/users/${props.userId}`);
      Swal.fire(`Successfully deleted user: ${userToDelete.username}`);
      router.push("/");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Could not delete user...",
        text: `${(error as Error).message}`,
      });
    }
  }
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
          <button @click="launchDeleteUserDialog()">Delete User</button>
        </div>
      </div>
      <div v-if="err">{{ err }}</div>
    </div>
  </main>
</template>

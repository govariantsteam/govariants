<script setup lang="ts">
import { UserResponse, UserRole } from "@ogfcommunity/variants-shared";
import { ref, watchEffect, computed } from "vue";
import * as requests from "../requests";
import { useCurrentUser } from "@/stores/user";
import Swal from "sweetalert2";
import router from "@/router";
import { isEmail } from "validator";

const props = defineProps<{ userId: string }>();

const user = ref<UserResponse>();
const email = ref<string | null>(null);
const err = ref<string>();
const isEditingEmail = ref(false);
const newEmail = ref("");

// Simple email validation check
const isEmailValid = computed(() => {
  if (!newEmail.value || newEmail.value.trim() === "") {
    return true; // Allow empty for unsetting email
  }
  return isEmail(newEmail.value);
});

watchEffect(async () => {
  try {
    user.value = await requests.get(`/users/${props.userId}`);

    // Only fetch email if viewing own profile or admin
    const currentUser = useCurrentUser().value;
    if (
      currentUser &&
      (currentUser.id === props.userId || currentUser.role === "admin")
    ) {
      try {
        const emailResponse = await requests.get(
          `/users/${props.userId}/email`,
        );
        email.value = emailResponse.email;
      } catch (_e) {
        // User might not have permission or email might not be set
        email.value = null;
      }
    }
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

function startEditingEmail() {
  newEmail.value = email.value || "";
  isEditingEmail.value = true;
}

async function saveEmail() {
  try {
    const response = await requests.put(`/users/${props.userId}/email`, {
      email: newEmail.value,
    });
    email.value = response.email || null;
    isEditingEmail.value = false;
    Swal.fire({
      icon: "success",
      text: !response.email
        ? "Email removed successfully!"
        : "Email updated successfully!",
    });
  } catch (error) {
    Swal.fire({ icon: "error", text: `Error: ${error}` });
  }
}

function cancelEditingEmail() {
  isEditingEmail.value = false;
  newEmail.value = "";
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

        <div
          v-if="
            user.login_type === 'persistent' &&
            (loggedInUser?.id === user.id || loggedInUser?.role === 'admin')
          "
        >
          <div v-if="!isEditingEmail">
            <strong>Email:</strong> {{ email || "Not set" }}
            <button @click="startEditingEmail">
              {{ email ? "Change Email" : "Set Email" }}
            </button>
          </div>
          <div v-else>
            <label for="email">Email:</label>
            <input
              id="email"
              v-model="newEmail"
              type="email"
              placeholder="Enter email address (leave empty to unset)"
            />
            <div
              v-if="!isEmailValid"
              style="color: red; font-size: 0.9em; margin-top: 4px"
            >
              Email format doesn't look valid
            </div>
            <button @click="saveEmail">Save</button>
            <button @click="cancelEditingEmail">Cancel</button>
          </div>
        </div>

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

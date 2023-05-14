<script setup lang="ts">
import * as requests from "@/requests";
import { ref } from "vue";

const username = ref("");
const password = ref("");

const submit = () =>
  requests.post("/login", {
    username: username.value,
    password: password.value,
  });
</script>

<template>
  <main>
    <div>
      <label for="username">Username</label>
      <input
        id="username"
        name="username"
        type="text"
        autocomplete="username"
        required
        v-model="username"
      />
    </div>
    <span>hhfhf</span>
    <div>
      <label for="current-password">Password</label>
      <input
        id="current-password"
        name="password"
        type="password"
        autocomplete="current-password"
        required
        v-model="password"
      />
    </div>
    <div>
      <button type="submit" @click="submit">Sign in</button>
    </div>
  </main>
</template>

<script setup lang="ts">
import * as requests from "@/requests";
import { ref } from "vue";
import { useRouter } from "vue-router";

const username = ref("");
const password = ref("");
const error = ref("");

const router = useRouter();

const submit = () =>
  requests
    .post("/register", {
      username: username.value,
      password: password.value,
    })
    .then(() => {
      router.push("/");
    })
    .catch((e) => (error.value = e));
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
      <button type="submit" @click="submit">Register</button>
    </div>
    <span class="error">{{ error }}</span>
  </main>
</template>

<style>
.error {
  color: red;
}
</style>

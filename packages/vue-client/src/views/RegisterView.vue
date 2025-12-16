<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "@/stores/user";

const username = ref("");
const password = ref("");
const email = ref("");
const error = ref("");

const store = useStore();

const router = useRouter();

const submit = () =>
  store
    .registerUser(username.value, password.value, email.value)
    .then(() => {
      router.push("/");
    })
    .catch((e) => (error.value = e));
</script>

<template>
  <main>
    <div class="grid-page-layout">
      <div>
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
          <label for="email">Email (optional)</label>
          <input
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            v-model="email"
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
        <div>
          Already have an account?
          <RouterLink to="login">Log in!</RouterLink>
        </div>
        <span class="error">{{ error }}</span>
      </div>
    </div>
  </main>
</template>

<style scoped>
.error {
  color: red;
}
</style>

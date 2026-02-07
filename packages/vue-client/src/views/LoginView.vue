<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "@/stores/user";

const store = useStore();

const username = ref("");
const password = ref("");
const error = ref("");

const router = useRouter();

const submit = () =>
  store
    .userLogin(username.value, password.value)
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
            v-model="username"
            name="username"
            type="text"
            autocomplete="username"
            required
          />
        </div>
        <div>
          <label for="current-password">Password</label>
          <input
            id="current-password"
            v-model="password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
          />
        </div>
        <div>
          <button type="submit" @click="submit">Log in</button>
        </div>
        <hr />
        <input
          type="button"
          value="Log in as guest"
          @click="store.guestLogin()"
        />
        <div>
          Don't have an account?
          <RouterLink to="register">Register here!</RouterLink>
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

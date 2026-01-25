<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "@/stores/user";
import { isEmail } from "validator";

const username = ref("");
const password = ref("");
const email = ref("");
const error = ref("");

const store = useStore();

const router = useRouter();

// Email validation check
const isEmailValid = computed(() => {
  if (!email.value || email.value.trim() === "") {
    return true; // Allow empty since email is optional
  }
  return isEmail(email.value);
});

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
            v-model="username"
            name="username"
            type="text"
            autocomplete="username"
            required
          />
        </div>
        <div>
          <label for="email">Email (optional)</label>
          <input
            id="email"
            v-model="email"
            name="email"
            type="email"
            autocomplete="email"
          />
          <div
            v-if="!isEmailValid"
            style="color: red; font-size: 0.9em; margin-top: 4px"
          >
            Email format doesn't look valid
          </div>
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

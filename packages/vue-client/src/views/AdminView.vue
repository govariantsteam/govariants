<script setup lang="ts">
import { ref, watchEffect } from "vue";
import * as requests from "../requests";
import { useCurrentUser } from "@/stores/user";
import Swal from "sweetalert2";
import router from "@/router";

const loggedInUser = useCurrentUser();
const testEmailAddress = ref<string>("");
const isSending = ref<boolean>(false);

// Redirect non-admins to home page
watchEffect(() => {
  if (loggedInUser.value && loggedInUser.value.role !== "admin") {
    router.push("/");
  }
});

async function sendTestEmail() {
  if (!testEmailAddress.value) {
    Swal.fire({
      icon: "error",
      text: "Please enter an email address",
    });
    return;
  }

  isSending.value = true;
  try {
    await requests.post("/admin/test-email", { to: testEmailAddress.value });
    Swal.fire({
      icon: "success",
      title: "Test Email Sent",
      text: `A test email has been sent to ${testEmailAddress.value}`,
    });
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Failed to Send Email",
      text: `${(error as Error).message}`,
    });
  } finally {
    isSending.value = false;
  }
}
</script>

<template>
  <main>
    <div class="grid-page-layout">
      <h1>Admin Panel</h1>

      <section class="admin-section">
        <h2>Test Email</h2>
        <p>Send a test email to verify SMTP configuration.</p>
        <div class="test-email-form">
          <input
            v-model="testEmailAddress"
            type="email"
            placeholder="recipient@example.com"
            :disabled="isSending"
          />
          <button :disabled="isSending" @click="sendTestEmail">
            {{ isSending ? "Sending..." : "Send Test Email" }}
          </button>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.admin-section {
  margin-bottom: 2rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.admin-section h2 {
  margin-top: 0;
}

.test-email-form {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.test-email-form input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.test-email-form button {
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.test-email-form button:hover:not(:disabled) {
  background-color: #0056b3;
}

.test-email-form button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
</style>

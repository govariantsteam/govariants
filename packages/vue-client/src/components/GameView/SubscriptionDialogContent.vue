<script setup lang="ts">
import { ref, watchEffect } from "vue";

const props = defineProps<{
  modelValue: number[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: number[]): void;
}>();

const local = ref<number[]>([]);

watchEffect(() => {
  local.value = [...props.modelValue];
});

function toggle(notificationType: number) {
  local.value = local.value.includes(notificationType)
    ? local.value.filter((x) => x !== notificationType)
    : [...local.value, notificationType];

  emit("update:modelValue", local.value);
}
</script>

<template>
  <div class="options">
    <label
      v-for="opt in [
        { notificationType: 1, label: 'Game end' },
        { notificationType: 2, label: 'New round' },
        { notificationType: 3, label: 'My move' },
        { notificationType: 4, label: 'Seat change' },
      ]"
      :key="opt.notificationType"
    >
      <input
        type="checkbox"
        :checked="local.includes(opt.notificationType)"
        @change="toggle(opt.notificationType)"
      />
      {{ opt.label }}
    </label>
  </div>
</template>

<style scoped>
.options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
label {
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>

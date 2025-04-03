<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="['arrow-icon', { 'is-collapsed': isCollapsed }]"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
</template>

<script setup lang="ts">
defineProps<{
  isCollapsed: boolean
}>()
</script>

<style scoped>
.arrow-icon {
  transition: transform 0.2s ease;
}

.arrow-icon.is-collapsed {
  transform: rotate(-90deg);
}
</style>

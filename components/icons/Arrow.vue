<template>
  <div class="arrow-wrapper" :class="{ 'collapsed': isCollapsed }">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4 6L8 10L12 6" stroke="#E5EDFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  isCollapsed: boolean
}>()

</script>


<style scoped>
.arrow-wrapper {
  background-color: #725DF8;
  border-radius: 12px;
  padding: 8px;
  display: flex;
}

.arrow-wrapper.collapsed {
  transition: transform 0.3s ease;
  transform: rotate(180deg);
}
</style>

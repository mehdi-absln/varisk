<script setup lang="ts">
defineProps<{ name: 'clock' | 'link' | 'share' }>()
</script>

<template>
  <svg
    width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'clock'">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.2 2" />
    </template>
    <template v-else-if="name === 'link'">
      <path d="M10.5 13.5a4 4 0 0 0 5.7 0l2.6-2.6a4 4 0 0 0-5.7-5.7l-1.4 1.4" />
      <path d="M13.5 10.5a4 4 0 0 0-5.7 0l-2.6 2.6a4 4 0 0 0 5.7 5.7l1.4-1.4" />
    </template>
    <template v-else>
      <circle cx="17.5" cy="6" r="2.6" />
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="17.5" cy="18" r="2.6" />
      <path d="M8.4 10.8 15.2 7.3M8.4 13.2l6.8 3.5" />
    </template>
  </svg>
</template>

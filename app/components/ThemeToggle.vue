<script setup lang="ts">
const { theme, toggle } = useTheme()
</script>

<template>
  <button
    type="button"
    class="grid place-items-center w-9 h-9 rounded-xl border border-line text-ink-2 hover:text-ink hover:bg-card-hi transition-colors"
    :title="theme === 'dark' ? 'حالت روشن' : 'حالت تیره'"
    :aria-label="theme === 'dark' ? 'حالت روشن' : 'حالت تیره'"
    @click="toggle"
  >
    <svg v-if="theme === 'dark'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </svg>
    <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" />
    </svg>
  </button>
</template>

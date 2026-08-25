<script setup lang="ts">
/**
 * The mark is the picture the whole product draws: a return distribution with
 * its loss tail shaded. VaR is exactly the cut line between the two.
 */
withDefaults(defineProps<{ size?: number }>(), { size: 34 })
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
    class="shrink-0"
  >
    <defs>
      <clipPath :id="`tail-${size}`">
        <rect x="0" y="0" width="11" height="32" />
      </clipPath>
    </defs>

    <rect
      x="0.9" y="0.9" width="30.2" height="30.2" rx="9.5"
      class="fill-card stroke-line" stroke-width="1.2"
    />

    <!-- Shaded loss tail -->
    <path
      d="M4 24 C 9 24 10 8 16 8 C 22 8 23 24 28 24 Z"
      class="fill-risk" opacity="0.85"
      :clip-path="`url(#tail-${size})`"
    />

    <!-- The distribution itself -->
    <path
      d="M4 24 C 9 24 10 8 16 8 C 22 8 23 24 28 24"
      class="stroke-brand" stroke-width="1.9"
      stroke-linecap="round" stroke-linejoin="round"
    />

    <!-- The cut line -->
    <path d="M11 6.5 L 11 25.5" class="stroke-ink" stroke-width="1.1" stroke-dasharray="2 2.2" opacity="0.55" />
  </svg>
</template>

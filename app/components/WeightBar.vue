<script setup lang="ts">
const props = defineProps<{ names: string[], weights: number[] }>()

// A single stacked rule: the composition at a glance. Brand teal steps down
// through cooler tints so it never competes with the red VaR figure above it.
const TINTS = ['var(--brand)', '#3D9FD6', '#5B7FE0', '#7C6BD1', '#9C6BB5']

const segments = computed(() =>
  props.names.map((name, i) => ({
    name,
    weight: props.weights[i]!,
    color: TINTS[i % TINTS.length]!,
  })),
)
</script>

<template>
  <div>
    <p class="eyebrow mb-3">ترکیب پرتفوی</p>

    <div class="flex h-2.5 rounded-full overflow-hidden gap-0.5 bg-bg-soft">
      <div
        v-for="s in segments"
        :key="s.name"
        class="transition-[flex-grow] duration-500 ease-out first:rounded-s-full last:rounded-e-full"
        :style="{ flexGrow: s.weight, backgroundColor: s.color }"
        :title="`${s.name} — ${faPercent(s.weight, 1)}`"
      />
    </div>

    <ul class="mt-4 flex flex-wrap gap-x-5 gap-y-2">
      <li v-for="s in segments" :key="s.name" class="flex items-center gap-2 text-xs">
        <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: s.color }" />
        <span class="text-ink-2">{{ s.name }}</span>
        <span class="text-ink-3 num">{{ faPercent(s.weight, 1) }}</span>
      </li>
    </ul>
  </div>
</template>

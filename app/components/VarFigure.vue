<script setup lang="ts">
import type { VarLevel } from '~/types/portfolio'

const props = defineProps<{ levels: VarLevel[], totalValue: number }>()

// 95% is the level people actually quote, so it gets the headline and the
// other two are demoted to a comparison strip beneath it.
const headline = computed(() => props.levels.find(l => l.confidence === 95) ?? props.levels[0]!)
const others = computed(() => props.levels.filter(l => l !== headline.value))

/** Bar length relative to the worst level, so 99% always fills the row. */
const worst = computed(() => Math.max(...props.levels.map(l => l.ratio), 1e-9))
</script>

<template>
  <figure>
    <!--
      The caption is a direct child of the figure, as the spec requires — nested
      in the flex row it was invalid HTML and Vue warned that it could break
      hydration. The row it used to sit in is rebuilt with the caption itself as
      the flex container instead.
    -->
    <figcaption class="eyebrow flex items-center justify-between gap-3">
      <span>ارزش در معرض خطر · افق یک روز</span>
      <span class="chip num">
        <span class="w-1.5 h-1.5 rounded-full bg-risk" />
        {{ faInt(headline.confidence) }}٪
      </span>
    </figcaption>

    <p class="figure text-risk text-[2.1rem] sm:text-[2.75rem] mt-5">
      {{ faInt(Math.round(headline.amount)) }}
      <span class="text-base font-semibold text-ink-3">تومان</span>
    </p>

    <p class="text-sm text-ink-2 leading-8 mt-3">
      با اطمینان <b class="text-ink font-bold">{{ faInt(headline.confidence) }}٪</b>،
      ضرر فردای شما از این مقدار بیشتر نخواهد بود — معادل
      <b class="text-risk font-bold num">{{ faPercent(headline.ratio) }}</b>
      از ارزش کل پرتفوی.
    </p>

    <!-- The other two levels, as bars so the cost of certainty is visible. -->
    <ul class="mt-6 space-y-3">
      <li v-for="l in others" :key="l.confidence" class="grid grid-cols-[3.6rem_1fr_auto] items-center gap-3">
        <span class="text-xs text-ink-3 num">{{ faInt(l.confidence) }}٪</span>
        <span class="h-1.5 rounded-full bg-bg-soft overflow-hidden">
          <span
            class="block h-full rounded-full bg-risk/45 transition-[width] duration-500 ease-out"
            :style="{ width: `${(l.ratio / worst) * 100}%` }"
          />
        </span>
        <span class="text-xs font-bold num text-ink-2 tabular-nums">{{ faInt(Math.round(l.amount)) }}</span>
      </li>
    </ul>

    <div class="flex items-baseline justify-between mt-6 pt-4 border-t border-line">
      <span class="text-xs text-ink-3">ارزش کل پرتفوی</span>
      <span class="text-sm font-bold num">{{ faInt(Math.round(totalValue)) }} <span class="text-ink-3 font-normal text-xs">تومان</span></span>
    </div>
  </figure>
</template>

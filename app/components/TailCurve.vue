<script setup lang="ts">
/**
 * The definition of VaR, drawn: a return distribution with its left tail
 * shaded and the confidence cut marked. Purely illustrative — the curve is a
 * gaussian sampled here, not the portfolio.
 */
const props = withDefaults(defineProps<{
  /** Fraction of the distribution left of the cut. 0.05 → the ۹۵٪ level. */
  tail?: number
}>(), { tail: 0.05 })

const W = 420
const H = 200
const BASE = 168   // y of the axis
const PEAK = 26    // y of the apex

/** Standard normal, scaled to the box: x in [-3.4, 3.4] across the width. */
const SPAN = 3.4
const toX = (z: number) => ((z + SPAN) / (2 * SPAN)) * W
const toY = (z: number) => BASE - Math.exp(-0.5 * z * z) * (BASE - PEAK)

const points = Array.from({ length: 121 }, (_, i) => {
  const z = -SPAN + (i / 120) * 2 * SPAN
  return `${toX(z).toFixed(2)},${toY(z).toFixed(2)}`
})

const curve = `M${points.join(' L')}`

/** One-sided quantiles for the levels the app actually reports. */
const Z_FOR = { 0.1: 1.282, 0.05: 1.645, 0.01: 2.326 } as const

const cutZ = computed(() => -(Z_FOR[props.tail as keyof typeof Z_FOR] ?? 1.645))
const cutX = computed(() => toX(cutZ.value))

/** The shaded region: curve from the far left up to the cut, closed on the axis. */
const tailArea = computed(() => {
  const steps = 40
  const pts = Array.from({ length: steps + 1 }, (_, i) => {
    const z = -SPAN + (i / steps) * (cutZ.value + SPAN)
    return `${toX(z).toFixed(2)},${toY(z).toFixed(2)}`
  })
  return `M${toX(-SPAN)},${BASE} L${pts.join(' L')} L${cutX.value.toFixed(2)},${BASE} Z`
})

const confidence = computed(() => Math.round((1 - props.tail) * 100))
</script>

<template>
  <figure class="panel p-5 sm:p-6">
    <svg :viewBox="`0 0 ${W} ${H}`" class="w-full h-auto" role="img"
      :aria-label="`نمودار توزیع بازده با دُم زیان در سطح اطمینان ${confidence} درصد`">
      <defs>
        <linearGradient :id="`fill-${tail}`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--risk)" stop-opacity="0.55" />
          <stop offset="100%" stop-color="var(--risk)" stop-opacity="0.05" />
        </linearGradient>
      </defs>

      <!-- Axis -->
      <line :x1="0" :y1="BASE" :x2="W" :y2="BASE" stroke="var(--line)" stroke-width="1" />

      <!-- Loss tail -->
      <path :d="tailArea" :fill="`url(#fill-${tail})`" />

      <!-- Distribution -->
      <path :d="curve" fill="none" stroke="var(--brand)" stroke-width="2.4" stroke-linejoin="round" />

      <!-- The cut -->
      <line :x1="cutX" :y1="BASE" :x2="cutX" :y2="34" stroke="var(--risk)" stroke-width="1.6" stroke-dasharray="4 4" />
      <circle :cx="cutX" :cy="BASE" r="3.5" fill="var(--risk)" />
    </svg>

    <figcaption class="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-line">
      <span class="flex items-center gap-2 text-xs text-ink-2">
        <span class="w-2.5 h-2.5 rounded-full bg-risk" />
        زیان فراتر از VaR · {{ faPercent(tail, 0) }} احتمال
      </span>
      <span class="chip num">سطح اطمینان {{ faInt(confidence) }}٪</span>
    </figcaption>
  </figure>
</template>

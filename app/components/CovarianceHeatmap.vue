<script setup lang="ts">
const props = defineProps<{
  names: string[]
  /** n×n correlation matrix, diagonal 1. */
  correlation: number[][]
  /** n×n covariance matrix, shown in the hover readout. */
  covariance: number[][]
}>()

/** The cell whose exact coefficients the readout is showing. */
const active = ref<{ i: number, j: number } | null>(null)

/**
 * A mouse rests on a cell; a finger cannot. The readout used to be hover-only,
 * which left it permanently unreachable on a phone — and the panel's own hint
 * told the user to do the one thing their device does not support.
 *
 * The two inputs are told apart by pointer type rather than by a media query,
 * so a hybrid laptop follows whichever the user actually reached for, and the
 * emulated `mouseenter` a touchscreen fires before `click` cannot toggle the
 * selection straight back off.
 */
function hover(e: PointerEvent, cell: { i: number, j: number } | null) {
  if (e.pointerType === 'mouse') active.value = cell
}

/** Touch and pen: tap to open, tap the open cell again to dismiss. */
function tap(e: PointerEvent, i: number, j: number) {
  if (e.pointerType === 'mouse') return
  const a = active.value
  active.value = a && a.i === i && a.j === j ? null : { i, j }
}

/** Persian names are long; the axis only has room for a short label. */
function short(name: string) {
  return name.length > 10 ? `${name.slice(0, 9)}…` : name
}

/**
 * −1 → green (the pair hedges itself), 0 → the panel colour, +1 → red (they
 * fall together). Reading a saturated red block as "concentrated risk" is the
 * whole point of the matrix.
 *
 * The blend is done by the browser against live theme variables, so the map
 * follows the theme instead of carrying its own copy of the palette. Capping
 * the mix at 55% keeps `--text` legible on every cell in both themes.
 */
function cellStyle(c: number) {
  const x = Math.max(-1, Math.min(1, c))
  const tone = x < 0 ? 'var(--gain)' : 'var(--risk)'
  const strength = Math.abs(x) * 55
  return { backgroundColor: `color-mix(in oklab, ${tone} ${strength}%, var(--card))` }
}

const readout = computed(() => {
  if (!active.value) return null
  const { i, j } = active.value
  return {
    pair: i === j ? props.names[i]! : `${props.names[i]} و ${props.names[j]}`,
    corr: props.correlation[i]![j]!,
    cov: props.covariance[i]![j]!,
    self: i === j,
  }
})
</script>

<template>
  <section class="panel p-6 sm:p-7">
    <div class="flex items-start justify-between gap-4 mb-5">
      <div>
        <h3 class="text-lg font-extrabold tracking-tight">ماتریس هم‌وردایی</h3>
        <p class="text-ink-3 text-xs mt-1.5 leading-6">هم‌حرکتی هر جفت سهم؛ قطر، وردایی خودِ سهم است.</p>
      </div>
      <div class="shrink-0 text-center">
        <div
          class="h-2 w-24 rounded-full"
          style="background:linear-gradient(to left, color-mix(in oklab, var(--gain) 55%, var(--card)), var(--card), color-mix(in oklab, var(--risk) 55%, var(--card)))"
        />
        <div class="flex justify-between text-[0.62rem] text-ink-3 mt-1.5 num">
          <span>+۱</span><span>۰</span><span>−۱</span>
        </div>
      </div>
    </div>

    <div class="scroll-x -mx-1 px-1">
      <table class="border-separate border-spacing-1">
        <thead>
          <tr>
            <th class="w-24" />
            <th
              v-for="(n, j) in names"
              :key="`h-${j}`"
              class="text-ink-3 text-[0.66rem] font-semibold px-1 pb-1 align-bottom whitespace-nowrap"
              :title="n"
            >
              {{ short(n) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(n, i) in names" :key="`r-${i}`">
            <th class="text-ink-2 text-[0.72rem] font-medium text-start pe-3 w-24 max-w-24 truncate" :title="n">
              {{ short(n) }}
            </th>
            <td v-for="(_, j) in names" :key="`c-${i}-${j}`" class="p-0">
              <div
                class="w-[3.4rem] h-11 rounded-lg grid place-items-center text-[0.72rem] font-bold num cursor-default border transition-colors"
                :class="active && active.i === i && active.j === j
                  ? 'border-ink/50'
                  : 'border-line-soft'"
                :style="cellStyle(correlation[i]![j]!)"
                @pointerenter="hover($event, { i, j })"
                @pointerleave="hover($event, null)"
                @pointerup="tap($event, i, j)"
              >
                {{ faDecimal(correlation[i]![j]!, 2) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!--
      A floor rather than a fixed height: reserving the line keeps selecting a
      cell from reflowing the panel, but on a narrow phone the readout wraps to
      a second line and a hard 1.5rem clipped it.
    -->
    <p class="mt-5 min-h-6 flex flex-wrap items-center gap-y-1 text-xs text-ink-2">
      <template v-if="readout">
        <b class="text-ink font-bold">{{ readout.pair }}</b>
        <span class="mx-2 text-line">|</span>
        <span v-if="readout.self">وردایی خودش</span>
        <span v-else>همبستگی <span class="num">{{ faDecimal(readout.corr, 3) }}</span></span>
        <span class="mx-2 text-line">|</span>
        <span class="num" dir="ltr">Cov = {{ readout.cov.toExponential(2) }}</span>
      </template>
      <span v-else class="text-ink-3">روی هر خانه بزنید یا نگه دارید تا ضریب دقیق را ببینید.</span>
    </p>
  </section>
</template>

<script setup lang="ts">
import type { RiskResult } from '~/types/portfolio'

const props = defineProps<{ result: RiskResult }>()

const rows = computed(() =>
  props.result.names.map((name, i) => ({
    name,
    quantity: props.result.quantities[i] ?? 0,
    weight: props.result.weights[i]!,
    mean: props.result.means[i]!,
    stdDev: props.result.stdDevs[i]!,
    variance: props.result.variances[i]!,
  })),
)

const period = computed(() => {
  const { start, end } = props.result.dateRange
  return start && end ? `از ${start} تا ${end}` : null
})
</script>

<template>
  <section class="panel overflow-hidden">
    <header class="p-6 sm:p-7 border-b border-line">
      <h3 class="text-lg font-extrabold tracking-tight">آمار هر سهم</h3>
      <p class="text-ink-3 text-xs mt-2 leading-7">
        بر پایهٔ {{ faInt(result.periods) }} بازده روزانه<span v-if="period"> · {{ period }}</span>
        · وردایی با مخرج n−۱
        <span v-if="result.amountMode === 'suggested'">· تعدادها پیشنهاد سیستم است</span>
      </p>
    </header>

    <div class="overflow-x-auto">
      <table class="w-full text-sm min-w-[42rem]">
        <thead>
          <tr class="bg-bg-soft/60">
            <th class="text-start font-semibold text-ink-3 text-[0.7rem] py-3 px-6">سهم</th>
            <th class="text-end font-semibold text-ink-3 text-[0.7rem] py-3 px-3">تعداد</th>
            <th class="text-end font-semibold text-ink-3 text-[0.7rem] py-3 px-3">وزن</th>
            <th class="text-end font-semibold text-ink-3 text-[0.7rem] py-3 px-3">میانگین بازده</th>
            <th class="text-end font-semibold text-ink-3 text-[0.7rem] py-3 px-3">وردایی</th>
            <th class="text-end font-semibold text-ink-3 text-[0.7rem] py-3 px-6">انحراف معیار</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.name" class="border-t border-line-soft hover:bg-card-hi transition-colors">
            <td class="py-3 px-6 font-semibold truncate max-w-40">{{ r.name }}</td>
            <td class="py-3 px-3 text-end text-ink-2 num">{{ faInt(r.quantity) }}</td>
            <td class="py-3 px-3 text-end text-ink-2 num">{{ faPercent(r.weight, 1) }}</td>
            <td class="py-3 px-3 text-end num font-semibold" :class="r.mean >= 0 ? 'text-gain' : 'text-risk'">
              {{ faPercent(r.mean, 3) }}
            </td>
            <td class="py-3 px-3 text-end text-ink-3 num" dir="ltr">{{ r.variance.toExponential(2) }}</td>
            <td class="py-3 px-6 text-end text-ink-2 num">{{ faPercent(r.stdDev, 2) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="font-bold border-t-2 border-line bg-bg-soft/60">
            <td class="py-3.5 px-6">کل پرتفوی</td>
            <td class="py-3.5 px-3 text-end text-ink-3 num">—</td>
            <td class="py-3.5 px-3 text-end num">۱۰۰٪</td>
            <td class="py-3.5 px-3 text-end num" :class="result.portfolioMean >= 0 ? 'text-gain' : 'text-risk'">
              {{ faPercent(result.portfolioMean, 3) }}
            </td>
            <td class="py-3.5 px-3 text-end text-ink-3 num" dir="ltr">
              {{ (result.portfolioStdDev ** 2).toExponential(2) }}
            </td>
            <td class="py-3.5 px-6 text-end num">{{ faPercent(result.portfolioStdDev, 2) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <p class="text-xs text-ink-3 leading-7 px-6 sm:px-7 py-4 border-t border-line">
      انحراف معیار پرتفوی از همهٔ سهم‌ها کمتر است؛ همین اثر تنوع‌بخشی است.
    </p>
  </section>
</template>

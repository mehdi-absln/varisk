<script setup lang="ts">
import type { AmountMode } from '~/types/portfolio'

export interface StockDraft {
  /** Stable identity, so the list can animate rows in and out correctly. */
  id: number
  name: string
  /** Share count. The position value is derived from it, never typed. */
  quantity: number | null
  /** Raw pasted text; parsed live so the count is visible while typing. */
  series: string
}

const props = defineProps<{
  index: number
  canRemove: boolean
  amountMode: AmountMode
  /** What the system would hold, given the budget and the latest price. */
  suggested: number
  /** Validation messages for this row, from `portfolioSchema`. */
  issues: string[]
}>()

const emit = defineEmits<{ remove: [] }>()

const stock = defineModel<StockDraft>({ required: true })

const open = ref(false)
const parsed = computed(() => parsePriceSeries(stock.value.series))

const suggesting = computed(() => props.amountMode === 'suggested')

/** In suggested mode the system number wins over whatever was typed before. */
const effectiveQuantity = computed(() =>
  suggesting.value ? props.suggested : (stock.value.quantity ?? 0),
)

const lastPrice = computed(() => parsed.value.prices.at(-1) ?? 0)
const value = computed(() => effectiveQuantity.value * lastPrice.value)

const status = computed(() => {
  const { prices, invalid } = parsed.value
  if (!stock.value.series.trim()) return { tone: 'empty' as const, text: 'افزودن قیمت‌ها' }
  if (invalid.length) return { tone: 'warn' as const, text: `${faInt(invalid.length)} مقدار ناخوانا` }
  if (prices.length < 3) return { tone: 'warn' as const, text: 'کمتر از ۳ قیمت' }
  return { tone: 'ok' as const, text: `${faInt(prices.length)} قیمت` }
})
</script>

<template>
  <div
    class="rounded-xl border transition-colors"
    :class="[
      props.issues.length ? 'border-risk/40' : open ? 'border-brand/40' : 'border-line-soft hover:border-line',
      open ? 'bg-card-hi' : 'hover:bg-card-hi/60',
    ]"
  >
    <!--
      Mobile stacks into two rows: [index | name | remove] over
      [quantity | value | status]. Placement is explicit rather than flex-wrap,
      so the columns stay aligned down the whole list.
    -->
    <div class="grid grid-cols-[1.5rem_1fr_auto] sm:grid-cols-[1.5rem_1fr_6rem_7rem_auto_auto] items-center gap-x-3 gap-y-2.5 p-2.5">
      <span class="col-start-1 row-start-1 grid place-items-center w-6 h-6 rounded-md bg-bg-soft text-ink-3 text-[0.68rem] font-bold num">
        {{ faInt(index + 1) }}
      </span>

      <input
        v-model="stock.name"
        type="text"
        placeholder="نام سهم"
        class="field col-start-2 row-start-1 min-w-0 font-semibold"
      >

      <!-- Share count -->
      <div class="col-start-2 row-start-2 sm:col-start-3 sm:row-start-1 min-w-0">
        <input
          v-if="!suggesting"
          v-model.number="stock.quantity"
          type="number"
          min="0"
          step="1"
          placeholder="تعداد"
          dir="ltr"
          class="field text-left num"
        >
        <p
          v-else
          class="text-sm num text-left px-3 py-2 rounded-lg bg-bg-soft text-ink-3 truncate"
          dir="ltr"
          :title="`عدد پیشنهادی برای سهام: ${faInt(suggested)}`"
        >
          {{ faInt(suggested) }}
        </p>
      </div>

      <!-- Derived position value -->
      <p
        class="col-start-3 row-start-2 sm:col-start-4 sm:row-start-1 text-xs text-end num whitespace-nowrap"
        :class="value > 0 ? 'text-ink' : 'text-ink-3'"
      >
        {{ value > 0 ? faInt(Math.round(value)) : '—' }}
        <span class="text-ink-3">ت</span>
      </p>

      <button
        type="button"
        class="tap col-start-2 row-start-3 sm:col-start-5 sm:row-start-1 justify-self-start sm:justify-self-end chip text-[0.68rem] transition-colors"
        :class="{
          'text-gain border-gain/30 bg-gain/10': status.tone === 'ok',
          'text-gold border-gold/30 bg-gold/10': status.tone === 'warn',
          'hover:text-ink hover:border-brand/40': status.tone === 'empty',
        }"
        :aria-expanded="open"
        @click="open = !open"
      >
        {{ status.text }}
        <svg
          width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
          class="transition-transform" :class="open ? 'rotate-180' : ''"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <button
        type="button"
        class="tap col-start-3 row-start-1 sm:col-start-6 justify-self-end grid place-items-center w-7 h-7 rounded-lg text-ink-3 hover:text-risk hover:bg-risk/10 disabled:opacity-25 disabled:hover:text-ink-3 disabled:hover:bg-transparent transition-colors"
        :disabled="!canRemove"
        title="حذف سهم"
        aria-label="حذف سهم"
        @click="emit('remove')"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!--
      Validation messages for this row. They sit outside the collapsible body so
      a closed row still says what is wrong with it.
    -->
    <ul v-if="props.issues.length" class="px-2.5 pb-2.5 -mt-0.5 space-y-1">
      <li
        v-for="message in props.issues"
        :key="message"
        class="flex items-start gap-2 text-risk text-xs leading-6"
      >
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.4" stroke-linecap="round" class="mt-1 shrink-0"
        >
          <circle cx="12" cy="12" r="9" /><path d="M12 8v4.5M12 16h.01" />
        </svg>
        <span>{{ message }}</span>
      </li>
    </ul>

    <div v-if="open" class="px-2.5 pb-3">
      <label class="block text-xs text-ink-3 mb-2 leading-6">
        قیمت‌های پایانی، از قدیمی به جدید — مستقیم از اکسل کپی کنید.
      </label>
      <textarea
        v-model="stock.series"
        rows="4"
        dir="ltr"
        placeholder="8400&#10;8520&#10;8390"
        class="field text-left num text-xs resize-y leading-6"
      />
      <p v-if="parsed.invalid.length" class="text-gold text-xs mt-2">
        نادیده گرفته شد: {{ parsed.invalid.slice(0, 5).join('، ') }}
      </p>
      <p v-else-if="lastPrice > 0" class="text-ink-3 text-xs mt-2">
        آخرین قیمت: <span class="num text-ink-2 font-semibold">{{ faInt(lastPrice) }}</span> تومان
      </p>
    </div>
  </div>
</template>

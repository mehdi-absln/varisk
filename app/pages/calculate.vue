<script setup lang="ts">
import type { AmountMode } from '~/types/portfolio'
import type { StockDraft } from '~/components/StockRow.vue'
import type { ParsedTable } from '~/utils/parseTable'

useSeoMeta({ title: `محاسبهٔ ریسک — ${SITE_NAME}` })

/** Row identity is assigned here, never by the sample or upload helpers. */
let nextStockId = 0
const emptyStock = (): StockDraft => ({ id: nextStockId++, name: '', quantity: null, series: '' })
const withIds = (rows: Omit<StockDraft, 'id'>[]): StockDraft[] =>
  rows.map(row => ({ ...row, id: nextStockId++ }))

const stocks = ref<StockDraft[]>([emptyStock()])
const marketSeries = ref('')
const dateStart = ref('')
const dateEnd = ref('')
const amountMode = ref<AmountMode>('custom')
const budget = ref<number | null>(DEFAULT_BUDGET)
const tableNotes = ref<string[]>([])

function addStock() {
  stocks.value.push(emptyStock())
}
function removeStock(i: number) {
  stocks.value.splice(i, 1)
}

function loadSample() {
  const range = sampleDateRange()
  stocks.value = withIds(sampleStocks())
  marketSeries.value = sampleMarketSeries()
  dateStart.value = range.start
  dateEnd.value = range.end
  amountMode.value = 'custom'
  tableNotes.value = []
}

function reset() {
  stocks.value = [emptyStock()]
  marketSeries.value = ''
  dateStart.value = ''
  dateEnd.value = ''
  amountMode.value = 'custom'
  budget.value = DEFAULT_BUDGET
  tableNotes.value = []
}

/** An uploaded table replaces the whole portfolio in one step. */
function applyTable(table: ParsedTable) {
  const market = table.marketColumn
  stocks.value = withIds(table.columns
    .filter((_, i) => i !== market)
    .map(c => ({ name: c.name, quantity: null, series: c.prices.join('\n') })))

  if (market !== null) marketSeries.value = table.columns[market]!.prices.join('\n')

  // Nothing in a price file says how many shares are held, so fall back to the
  // system suggestion — the user sees a result immediately and can override.
  amountMode.value = 'suggested'
  tableNotes.value = table.notes
}

// ── Derived input ───────────────────────────────────────────────────────────

const marketPrices = computed(() => parsePriceSeries(marketSeries.value).prices)

const seriesPerStock = computed(() =>
  stocks.value.map(s => parsePriceSeries(s.series).prices),
)

/** The «عدد پیشنهادی» for each row, given the budget and the latest price. */
const suggestedQuantities = computed(() =>
  seriesPerStock.value.map(prices =>
    suggestQuantity(prices, stocks.value.length, budget.value ?? 0)),
)

const quantities = computed(() =>
  stocks.value.map((s, i) =>
    amountMode.value === 'suggested' ? suggestedQuantities.value[i]! : (s.quantity ?? 0)),
)

const values = computed(() =>
  quantities.value.map((q, i) => q * (seriesPerStock.value[i]?.at(-1) ?? 0)),
)

const totalValue = computed(() => values.value.reduce((a, b) => a + b, 0))

const touched = computed(() =>
  stocks.value.some(s => s.name.trim() || s.quantity || s.series.trim())
  || !!marketSeries.value.trim() || !!dateStart.value || !!dateEnd.value,
)

// ── Dates ───────────────────────────────────────────────────────────────────

const parsedStart = computed(() => parseJalali(dateStart.value))
const parsedEnd = computed(() => parseJalali(dateEnd.value))

const spanDays = computed(() =>
  parsedStart.value && parsedEnd.value
    ? jalaliSpanDays(parsedStart.value, parsedEnd.value)
    : null,
)

/**
 * The range labels the analysis rather than driving it — the prices are already
 * in hand. It still earns its place: a span that cannot hold the number of
 * observations means the data and the dates disagree.
 */
const dateNotes = computed(() => {
  const notes: string[] = []
  if (dateStart.value.trim() && !parsedStart.value) notes.push('تاریخ شروع نامعتبر است.')
  if (dateEnd.value.trim() && !parsedEnd.value) notes.push('تاریخ پایان نامعتبر است.')

  const span = spanDays.value
  if (span !== null && span <= 0) {
    notes.push('تاریخ پایان باید بعد از تاریخ شروع باشد.')
    return notes
  }

  const observations = seriesPerStock.value[0]?.length ?? 0
  if (span !== null && observations > 2) {
    // Tehran trades Saturday–Wednesday, so a window holds roughly 5/7 of its
    // calendar days as sessions, before holidays.
    const sessions = Math.round((span * 5) / 7)
    if (observations > sessions) {
      notes.push(`این بازه حدود ${faInt(sessions)} روز معاملاتی دارد، ولی ${faInt(observations)} قیمت وارد شده.`)
    }
    else if (sessions > observations * 1.6) {
      notes.push(`بازه بسیار بلندتر از ${faInt(observations)} قیمت وارد‌شده است.`)
    }
  }

  return notes
})

// ── Validation ──────────────────────────────────────────────────────────────

/**
 * What still stands between the current input and a number.
 *
 * The rules live in `portfolioSchema.ts` so they can be tested without mounting
 * the page; here we only hand over the resolved portfolio.
 */
const issues = computed(() => validatePortfolio({
  stocks: stocks.value.map((s, i) => ({
    name: s.name,
    quantity: quantities.value[i]!,
    prices: seriesPerStock.value[i]!,
  })),
  marketPrices: marketPrices.value,
  amountMode: amountMode.value,
}))

/** Everything still blocking a result, for the summary panel. */
const missing = computed(() => issues.value.all)

/** How much of the input is in place — drives the progress rail. */
const progress = computed(() => {
  const total = 4
  const done = [
    stocks.value.some(s => s.name.trim()),
    seriesPerStock.value.some(p => p.length >= 3),
    marketPrices.value.length >= 3,
    quantities.value.some(q => q > 0),
  ].filter(Boolean).length
  return { done, total, ratio: done / total }
})

/**
 * Live: the whole calculation is client-side, so there is no reason to make the
 * user press a button. Phase 1 swaps `mockRiskResult` for the tested engine.
 */
const result = computed(() => {
  if (missing.value.length) return null
  return mockRiskResult({
    names: stocks.value.map(s => s.name),
    quantities: quantities.value,
    values: values.value,
    dateRange: { start: dateStart.value.trim(), end: dateEnd.value.trim() },
    amountMode: amountMode.value,
    periods: marketPrices.value.length - 1,
  })
})
</script>

<template>
  <div>
    <!-- ── Page head ────────────────────────────────────────────────────── -->
    <section class="relative overflow-hidden border-b border-line">
      <div class="absolute inset-0 grid-field pointer-events-none" aria-hidden="true" />
      <div class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div class="flex flex-wrap items-end justify-between gap-5">
          <div>
            <span class="chip">
              <span class="w-1.5 h-1.5 rounded-full bg-gain" />
              محاسبهٔ زنده
            </span>
            <h1 class="text-2xl sm:text-[2rem] font-extrabold tracking-tight mt-4">پرتفوی خود را وارد کنید</h1>
            <p class="text-ink-2 text-sm leading-8 mt-2 max-w-lg">
              نتیجه هم‌زمان با تایپ شما به‌روز می‌شود؛ دکمهٔ محاسبه‌ای در کار نیست.
            </p>
          </div>

          <div class="flex items-center gap-2.5">
            <button type="button" class="btn btn-ghost py-2 px-4 text-[0.82rem]" @click="loadSample">
              پرتفوی نمونه
            </button>
            <button
              v-if="touched"
              type="button"
              class="btn btn-ghost py-2 px-4 text-[0.82rem] text-ink-3"
              @click="reset"
            >
              پاک کردن
            </button>
          </div>
        </div>

        <!-- Progress rail: four things the engine needs, and how many are in. -->
        <div class="flex items-center gap-3 mt-7 max-w-md">
          <div class="flex-1 h-1.5 rounded-full bg-bg-soft overflow-hidden">
            <div
              class="h-full rounded-full transition-[width] duration-500 ease-out"
              :class="result ? 'bg-gain' : 'bg-brand'"
              :style="{ width: `${progress.ratio * 100}%` }"
            />
          </div>
          <span class="text-xs text-ink-3 num whitespace-nowrap">
            {{ faInt(progress.done) }} از {{ faInt(progress.total) }}
          </span>
        </div>
      </div>
    </section>

    <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
      <div class="grid lg:grid-cols-[1.15fr_0.85fr] gap-x-10 gap-y-10 [&>*]:min-w-0">
        <!-- ── Input column ─────────────────────────── -->
        <section class="space-y-6">
          <!-- Upload -->
          <div class="panel p-6">
            <div class="flex items-baseline justify-between mb-4">
              <h2 class="text-base font-extrabold tracking-tight">بارگذاری جدول قیمت</h2>
              <span class="chip">اختیاری</span>
            </div>
            <FileDrop @parsed="applyTable" />
            <ul v-if="tableNotes.length" class="mt-3 space-y-1.5">
              <li v-for="n in tableNotes" :key="n" class="text-xs text-ink-3 leading-6">{{ n }}</li>
            </ul>
          </div>

          <!-- Stocks -->
          <div class="panel p-6">
            <div class="flex items-baseline justify-between mb-4">
              <h2 class="text-base font-extrabold tracking-tight">سهام</h2>
              <span class="chip num">{{ faInt(stocks.length) }} سهم</span>
            </div>

            <TransitionGroup tag="div" name="row" class="relative space-y-2">
              <StockRow
                v-for="(s, i) in stocks"
                :key="s.id"
                v-model="stocks[i]!"
                :index="i"
                :can-remove="stocks.length > 1"
                :amount-mode="amountMode"
                :suggested="suggestedQuantities[i] ?? 0"
                :issues="issues.rows[i] ?? []"
                @remove="removeStock(i)"
              />
            </TransitionGroup>

            <div class="flex flex-wrap items-center justify-between gap-3 pt-4 mt-2 border-t border-line-soft">
              <button type="button" class="btn btn-ghost py-1.5 px-3.5 text-[0.8rem]" @click="addStock">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                افزودن سهم
              </button>
              <p class="text-sm">
                <span class="text-ink-3 text-xs">ارزش کل</span>
                <b class="font-extrabold num mr-2">{{ faInt(Math.round(totalValue)) }}</b>
                <span class="text-ink-3 text-xs">تومان</span>
              </p>
            </div>
          </div>

          <!-- Amount mode -->
          <div class="panel p-6">
            <h2 class="text-base font-extrabold tracking-tight mb-4">مقدار سهام</h2>

            <div class="grid sm:grid-cols-2 gap-3">
              <label
                v-for="opt in [
                  { value: 'suggested', title: 'لیست پیشنهادی سیستم', hint: 'سرمایهٔ فرضی به‌طور مساوی بین سهم‌ها تقسیم و به تعداد سهم تبدیل می‌شود.' },
                  { value: 'custom', title: 'لیست دلخواه', hint: 'تعداد هر سهم را خودتان در جدول بالا وارد کنید.' },
                ]"
                :key="opt.value"
                class="rounded-xl border p-4 cursor-pointer transition-colors"
                :class="amountMode === opt.value
                  ? 'border-brand bg-brand/5'
                  : 'border-line-soft hover:border-line hover:bg-card-hi'"
              >
                <span class="flex items-center gap-2.5">
                  <input v-model="amountMode" type="radio" :value="opt.value" class="accent-[var(--brand)] w-4 h-4">
                  <span class="text-sm font-bold">{{ opt.title }}</span>
                </span>
                <span class="block text-xs text-ink-3 leading-7 mt-2">{{ opt.hint }}</span>
              </label>
            </div>

            <div v-if="amountMode === 'suggested'" class="mt-4 flex items-center gap-3">
              <label for="budget" class="text-xs text-ink-3 shrink-0">سرمایهٔ فرضی</label>
              <input
                id="budget"
                v-model.number="budget"
                type="number"
                min="0"
                dir="ltr"
                class="field w-44 text-left num"
              >
              <span class="text-xs text-ink-3">تومان</span>
            </div>
          </div>

          <!-- Date range -->
          <div class="panel p-6">
            <div class="flex items-baseline justify-between mb-4">
              <h2 class="text-base font-extrabold tracking-tight">تاریخ اطلاعات</h2>
              <span v-if="spanDays !== null && spanDays > 0" class="chip num">{{ faInt(spanDays) }} روز</span>
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
              <label class="block">
                <span class="block text-xs text-ink-3 mb-1.5">تاریخ شروع</span>
                <input
                  v-model="dateStart"
                  type="text"
                  inputmode="numeric"
                  placeholder="۱۴۰۴/۰۲/۰۱"
                  dir="ltr"
                  class="field text-left num"
                >
              </label>
              <label class="block">
                <span class="block text-xs text-ink-3 mb-1.5">تاریخ پایان</span>
                <input
                  v-model="dateEnd"
                  type="text"
                  inputmode="numeric"
                  placeholder="۱۴۰۴/۰۴/۲۵"
                  dir="ltr"
                  class="field text-left num"
                >
              </label>
            </div>

            <ul v-if="dateNotes.length" class="mt-3 space-y-1.5">
              <li v-for="n in dateNotes" :key="n" class="text-xs text-gold leading-7">{{ n }}</li>
            </ul>
            <p v-else class="text-xs text-ink-3 mt-3 leading-7">
              بازهٔ داده، نتیجه را برچسب می‌زند و با تعداد قیمت‌ها مقایسه می‌شود.
            </p>
          </div>

          <!-- Market index — beta is meaningless without it. -->
          <div class="panel p-6">
            <div class="flex items-baseline justify-between mb-3">
              <h2 class="text-base font-extrabold tracking-tight">شاخص کل بورس</h2>
              <span class="chip num">
                {{ marketPrices.length ? `${faInt(marketPrices.length)} قیمت` : '—' }}
              </span>
            </div>
            <p class="text-ink-3 text-xs leading-7 mb-3">
              بتای هر سهم نسبت به همین سری سنجیده می‌شود، پس باید هم‌طول با سری سهم‌ها باشد.
            </p>
            <textarea
              v-model="marketSeries"
              rows="4"
              dir="ltr"
              placeholder="2140000&#10;2152300&#10;2138900"
              class="field text-left num text-xs resize-y leading-6"
            />
          </div>
        </section>

        <!-- ── Live readout column ──────────────────── -->
        <aside class="min-w-0 lg:sticky lg:top-24 lg:self-start space-y-3">
          <div class="panel p-6 sm:p-7">
            <template v-if="result">
              <VarFigure :levels="result.varLevels" :total-value="result.totalValue" />
              <hr class="border-line my-7">
              <WeightBar :names="result.names" :weights="result.weights" />
            </template>

            <template v-else>
              <p class="eyebrow">ارزش در معرض خطر · افق یک روز</p>
              <p class="figure text-[2.1rem] sm:text-[2.75rem] text-line mt-5">—</p>
              <p class="text-xs text-ink-3 mt-4 mb-5">برای رسیدن به عدد، این‌ها لازم است:</p>
              <ul class="space-y-2.5">
                <li v-for="m in missing" :key="m" class="flex gap-2.5 text-sm text-ink-2 leading-7">
                  <span class="mt-2 w-1.5 h-1.5 rounded-full bg-gold shrink-0" aria-hidden="true" />
                  <span>{{ m }}</span>
                </li>
              </ul>
            </template>
          </div>

          <p class="text-xs text-ink-3 leading-7 px-1">
            اعداد فعلی با دادهٔ نمونه ساخته می‌شوند تا طراحی ارزیابی شود؛ موتور واقعی در فاز بعدی جایگزین می‌شود.
          </p>
        </aside>
      </div>

      <!-- ── Deeper analysis ──────────────────────── -->
      <div v-if="result" class="mt-20">
        <div class="max-w-xl">
          <p class="eyebrow">ساختار ریسک</p>
          <h2 class="text-2xl font-extrabold tracking-tight mt-3">
            ریسک از کجا می‌آید
          </h2>
          <p class="text-ink-2 text-sm leading-8 mt-3">
            هم‌وردایی، بتا و آمار تک‌تک سهم‌ها — همان چیزی که عدد بالا از آن ساخته شده.
          </p>
        </div>

        <div class="grid lg:grid-cols-2 gap-6 mt-8 [&>*]:min-w-0">
          <CovarianceHeatmap
            :names="result.names"
            :correlation="result.correlation"
            :covariance="result.covariance"
          />
          <BetaChart :names="result.names" :betas="result.betas" :weights="result.weights" />
        </div>

        <div class="mt-6">
          <StatsTable :result="result" />
        </div>
      </div>
    </div>
  </div>
</template>

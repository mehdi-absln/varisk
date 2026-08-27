<script setup lang="ts">
usePageSeo({
  title: `${SITE_NAME} — نرم‌افزار آنلاین محاسبهٔ ارزش در معرض خطر (VaR)`,
  description: HEADLINE.subtitle,
  path: '/',
})

// The landing shows the same component the tool uses, on sample data — no
// mocked-up screenshot that the product then fails to live up to. The figure is
// now genuinely computed: the sample series goes through the same engine the
// «محاسبه» page runs. Deterministic (seeded), so server and client agree.
const preview = calculateRisk({
  stocks: sampleStocks().map(s => ({
    name: s.name,
    quantity: s.quantity,
    prices: parsePriceSeries(s.series).prices,
  })),
  marketPrices: parsePriceSeries(sampleMarketSeries()).prices,
  dateRange: sampleDateRange(),
  amountMode: 'custom',
  budget: DEFAULT_BUDGET,
})

const method = [
  {
    n: '۰۱',
    title: 'بازده، نه قیمت',
    body: 'از سری قیمت‌های پایانی، بازده روزانه ساخته می‌شود؛ میانگین و وردایی روی همان بازده‌ها حساب می‌شوند، با مخرج n−۱.',
  },
  {
    n: '۰۲',
    title: 'ماتریس هم‌وردایی',
    body: 'هم‌حرکتی هر جفت سهم در یک ماتریس n×n می‌نشیند. انحراف معیار پرتفوی از همین‌جا می‌آید: σₚ = √(wᵀΣw).',
  },
  {
    n: '۰۳',
    // Not «ارزش در معرض خطر»: the section above already carries that heading,
    // and what distinguishes this step is the three levels, not the quantity.
    title: 'سه سطح اطمینان',
    body: 'VaR = z × σₚ × V، در سه سطح اطمینان ۹۰، ۹۵ و ۹۹ درصد — با ضرایب ۱٫۲۸۲، ۱٫۶۴۵ و ۲٫۳۲۶.',
  },
]
</script>

<template>
  <div>
    <!-- ── Hero ─────────────────────────────────────────────────────────── -->
    <section class="relative overflow-hidden aurora">
      <div class="absolute inset-0 grid-field pointer-events-none" aria-hidden="true" />

      <div class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16">
        <div class="grid lg:grid-cols-[1.05fr_0.95fr] gap-x-14 gap-y-12 items-center [&>*]:min-w-0">
          <div>
            <span class="chip">
              <span class="w-1.5 h-1.5 rounded-full bg-brand" />
              نرم‌افزار آنلاین محاسبهٔ ریسک بازار
            </span>

            <!-- Mirrors HEADLINE.title; split so the subject can carry colour. -->
            <h1 class="text-[2.15rem] sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.35] tracking-tight mt-6">
              به راحتی
              <span class="relative inline-block text-brand">
                ارزش در معرض خطر
                <svg
                  class="absolute -bottom-1 right-0 w-full h-2.5 text-brand/35"
                  viewBox="0 0 200 10" preserveAspectRatio="none" aria-hidden="true"
                >
                  <path d="M2 7 C 50 2, 150 2, 198 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
                </svg>
              </span>
              را محاسبه کنید!
            </h1>

            <p class="text-ink-2 text-base sm:text-lg leading-9 mt-7 max-w-xl">
              {{ HEADLINE.subtitle }}
            </p>

            <div class="flex flex-wrap items-center gap-3 mt-9">
              <NuxtLink to="/calculate" class="btn btn-primary">
                شروع محاسبه
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 12H5M11 18l-6-6 6-6" />
                </svg>
              </NuxtLink>
              <a href="#method" class="btn btn-ghost">روش محاسبه</a>
            </div>

            <ul class="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-xs text-ink-3">
              <li v-for="t in ['بدون ثبت‌نام', 'بدون ارسال داده به سرور', 'خروجی هم‌زمان با تایپ']" :key="t" class="flex items-center gap-1.5">
                <span class="w-1 h-1 rounded-full bg-ink-3" />{{ t }}
              </li>
            </ul>
          </div>

          <!-- A real readout, on sample data. -->
          <div>
            <div class="panel p-6 sm:p-7">
              <VarFigure :levels="preview.varLevels" :total-value="preview.totalValue" />
              <hr class="border-line my-7">
              <WeightBar :names="preview.names" :weights="preview.weights" />
            </div>
            <p class="text-xs text-ink-3 mt-3 text-center">
              نمونه‌ای از خروجی واقعی، روی پرتفوی چهارسهمی فرضی.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Three promises, straight from the spec ───────────────────────── -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6">
      <div class="panel grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-line">
        <div v-for="f in FEATURES" :key="f.title" class="p-6 sm:p-7">
          <span class="grid place-items-center w-10 h-10 rounded-xl bg-brand/10 text-brand">
            <FeatureIcon :name="f.icon" />
          </span>
          <h2 class="font-bold text-base mt-4">{{ f.title }}</h2>
          <p class="text-ink-2 text-[0.85rem] leading-8 mt-2">{{ f.body }}</p>
        </div>
      </div>
    </section>

    <!-- ── What VaR is ──────────────────────────────────────────────────── -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 pt-24">
      <div class="grid lg:grid-cols-2 gap-x-14 gap-y-10 items-center [&>*]:min-w-0">
        <div>
          <p class="eyebrow">تعریف</p>
          <h2 class="text-2xl sm:text-[2rem] font-extrabold tracking-tight mt-3">
            {{ SECTIONS[1]!.title }}
          </h2>
          <p class="text-ink-2 leading-9 mt-5">{{ SECTIONS[1]!.body }}</p>

          <div class="flex flex-wrap gap-2 mt-6">
            <span class="chip num">اطمینان ۹۰٪ · z = ۱٫۲۸۲</span>
            <span class="chip num">اطمینان ۹۵٪ · z = ۱٫۶۴۵</span>
            <span class="chip num">اطمینان ۹۹٪ · z = ۲٫۳۲۶</span>
          </div>
        </div>

        <TailCurve :tail="0.05" />
      </div>
    </section>

    <!-- ── Time saved ───────────────────────────────────────────────────── -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 pt-20">
      <article class="panel p-8 sm:p-10 grid md:grid-cols-[1fr_1.7fr] gap-x-12 gap-y-6 items-start">
        <div>
          <span class="grid place-items-center w-11 h-11 rounded-xl bg-brand/10 text-brand">
            <FeatureIcon name="clock" />
          </span>
          <h2 class="text-xl sm:text-2xl font-extrabold tracking-tight mt-4">
            {{ SECTIONS[0]!.title }}
          </h2>
        </div>
        <p class="text-ink-2 leading-9">{{ SECTIONS[0]!.body }}</p>
      </article>
    </section>

    <!-- ── Method ───────────────────────────────────────────────────────── -->
    <section id="method" class="max-w-6xl mx-auto px-4 sm:px-6 pt-24 scroll-mt-24">
      <div class="max-w-xl">
        <p class="eyebrow">روش کار</p>
        <h2 class="text-2xl sm:text-[2rem] font-extrabold tracking-tight mt-3">
          سه گام از قیمت تا عدد ریسک
        </h2>
        <p class="text-ink-2 leading-9 mt-4">
          همان فرمول‌های استاندارد نظریهٔ پرتفوی، بدون تقریب و بدون جعبهٔ سیاه.
        </p>
      </div>

      <ol class="grid md:grid-cols-3 gap-6 mt-10">
        <li v-for="m in method" :key="m.n" class="panel panel-lift p-7">
          <span class="figure text-4xl text-brand/30 num select-none">{{ m.n }}</span>
          <h3 class="font-bold text-base mt-4">{{ m.title }}</h3>
          <p class="text-ink-2 text-[0.85rem] leading-8 mt-2">{{ m.body }}</p>
        </li>
      </ol>
    </section>

    <!-- ── Closing ──────────────────────────────────────────────────────── -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 pt-24">
      <div class="panel relative overflow-hidden aurora px-6 sm:px-12 py-14 text-center">
        <div class="absolute inset-0 grid-field pointer-events-none" aria-hidden="true" />
        <div class="relative z-10">
          <h2 class="text-2xl sm:text-4xl font-extrabold tracking-tight leading-[1.5]">
            {{ CLOSING.title }}
          </h2>
          <p class="text-ink-2 leading-9 mt-6 max-w-3xl mx-auto">{{ CLOSING.body }}</p>
          <NuxtLink to="/calculate" class="btn btn-primary mt-9">
            پرتفوی خود را وارد کنید
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

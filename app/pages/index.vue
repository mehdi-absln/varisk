<script setup lang="ts">
useSeoMeta({
  title: 'شلیل اپ — محاسبهٔ ارزش در معرض خطر پرتفوی',
  description:
    'به راحتی ارزش در معرض خطر (VaR) پرتفوی سهام خود را محاسبه کنید: میانگین، وردایی، هم‌وردایی، بتا و ریسک کل — آنلاین و رایگان.',
  ogTitle: 'شلیل اپ',
  ogDescription: 'به راحتی ارزش در معرض خطر را محاسبه کنید!',
})

const features = [
  { icon: 'Σ', title: 'ریاضی واقعی', desc: 'میانگین، وردایی، هم‌وردایی و بتا با فرمول‌های استاندارد نظریهٔ پرتفوی — نه تقریب.' },
  { icon: '◔', title: 'دیتا را ببین', desc: 'نقشهٔ حرارتی ماتریس هم‌وردایی و نمودار VaR در سه سطح اطمینان ۹۰، ۹۵ و ۹۹ درصد.' },
  { icon: '⚡', title: 'سریع و رایگان', desc: 'همهٔ محاسبات در مرورگر شما انجام می‌شود؛ نه ثبت‌نام می‌خواهد نه انتظار.' },
]
</script>

<template>
  <!-- Hero -->
  <section class="max-w-5xl mx-auto px-5 pt-16 pb-12 text-center">
    <p class="text-teal text-sm font-semibold tracking-wide mb-3">نرم‌افزار آنلاین محاسبهٔ ریسک</p>
    <h1 class="text-4xl md:text-5xl font-extrabold leading-[1.5]">
      به راحتی<br>
      <span class="text-teal">ارزش در معرض خطر</span><br>
      را محاسبه کنید!
    </h1>
    <p class="text-mist mt-5 max-w-xl mx-auto leading-8">
      شلیل اپ مقدار ریسک پرتفوی سهام شما را می‌سنجد: از میانگین و وردایی تا بتا و VaR —
      همه‌چیز در مرورگر، بدون ثبت‌نام.
    </p>
    <NuxtLink
      to="/calculate"
      class="inline-block mt-8 px-8 py-3 rounded-full bg-teal text-night font-bold hover:bg-teal/90 transition-colors"
    >
      شروع محاسبه
    </NuxtLink>
  </section>

  <!-- Feature cards -->
  <section class="max-w-5xl mx-auto px-5 grid md:grid-cols-3 gap-4">
    <div v-for="f in features" :key="f.title" class="rounded-xl border border-edge bg-panel p-5">
      <div class="w-10 h-10 rounded-lg bg-teal-deep border border-teal/30 grid place-items-center text-teal mb-3">{{ f.icon }}</div>
      <h2 class="font-bold mb-1.5">{{ f.title }}</h2>
      <p class="text-mist text-sm leading-7">{{ f.desc }}</p>
    </div>
  </section>

  <!-- VaR teaser -->
  <section class="max-w-5xl mx-auto px-5 mt-14">
    <div class="rounded-2xl border border-edge bg-panel p-8 text-center">
      <p class="text-mist text-sm mb-2">با اطمینان ۹۵٪، ضرر فردای شما بیشتر از</p>
      <p class="text-3xl font-extrabold text-teal" dir="ltr">۱۲٬۴۰۰٬۰۰۰ تومان</p>
      <p class="text-mist text-sm mt-2">نخواهد بود. این یعنی VaR — و شلیل اپ همین را برای شما حساب می‌کند.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
const route = useRoute()

const nav = [
  { to: '/', label: 'معرفی' },
  { to: '/calculate', label: 'محاسبه' },
]
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Masthead: glass over whatever scrolls beneath it. -->
    <header class="sticky top-0 z-40 border-b border-line bg-bg/75 backdrop-blur-xl">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3 sm:gap-6">
        <NuxtLink to="/" class="flex items-center gap-2.5 shrink-0 group">
          <AppLogo :size="34" />
          <span class="leading-tight">
            <span class="block text-lg font-extrabold tracking-tight group-hover:text-brand transition-colors">{{ SITE_NAME }}</span>
            <span class="hidden sm:block text-[0.62rem] text-ink-3 font-medium tracking-wide">ارزش در معرض خطر</span>
          </span>
        </NuxtLink>

        <nav class="flex items-center gap-1 p-1 rounded-xl bg-bg-soft border border-line-soft">
          <NuxtLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            :class="route.path === item.to
              ? 'bg-card text-ink shadow-sm border border-line'
              : 'text-ink-3 hover:text-ink'"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>

        <div class="mr-auto flex items-center gap-2">
          <ThemeToggle />
          <NuxtLink
            v-if="route.path !== '/calculate'"
            to="/calculate"
            class="btn btn-primary hidden sm:inline-flex py-2 px-4 text-[0.82rem]"
          >
            شروع محاسبه
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <NuxtPage />
    </main>

    <footer class="border-t border-line bg-bg-soft/60 mt-24">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div class="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div class="flex items-center gap-2.5">
              <AppLogo :size="30" />
              <span class="text-base font-extrabold tracking-tight">{{ SITE_NAME }}</span>
            </div>
            <p class="text-ink-3 text-[0.82rem] leading-8 mt-4 max-w-sm">
              {{ HEADLINE.subtitle }}
            </p>
          </div>

          <div>
            <h3 class="eyebrow mb-4">پیمایش</h3>
            <ul class="space-y-2.5 text-sm">
              <li v-for="item in nav" :key="item.to">
                <NuxtLink :to="item.to" class="text-ink-2 hover:text-brand transition-colors">
                  {{ item.label }}
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/#method" class="text-ink-2 hover:text-brand transition-colors">
                  روش محاسبه
                </NuxtLink>
              </li>
            </ul>
          </div>

          <div>
            <h3 class="eyebrow mb-4">سازنده</h3>
            <p class="text-ink-2 text-sm font-semibold">{{ BUILDER }}</p>
            <p class="text-ink-3 text-xs leading-7 mt-1.5">طراحی و توسعه</p>
          </div>
        </div>

        <div class="mt-10 pt-6 border-t border-line flex flex-wrap items-center justify-between gap-3">
          <p class="text-ink-3 text-xs">{{ SITE_NAME }}</p>
          <p class="text-ink-3 text-xs">محاسبات کاملاً در مرورگر شما انجام می‌شود.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

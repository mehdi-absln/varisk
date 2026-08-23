<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="border-b border-edge/60 bg-panel/40 backdrop-blur-sm sticky top-0 z-10">
      <nav class="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2.5 font-bold text-lg tracking-tight">
          <span class="w-8 h-8 rounded-lg bg-teal-deep border border-teal/40 grid place-items-center text-teal text-sm">ش</span>
          <span>شلیل اپ</span>
        </NuxtLink>
        <NuxtLink
          to="/calculate"
          class="text-xs font-semibold text-night bg-teal hover:bg-teal/90 transition-colors rounded-full px-4 py-1.5"
        >
          شروع محاسبه
        </NuxtLink>
      </nav>
    </header>

    <main class="flex-1">
      <NuxtPage />
    </main>

    <footer class="border-t border-edge/60 py-6 mt-16">
      <p class="text-center text-mist text-xs">
        شلیل اپ · بازسازی ۱۴۰۵ از پروتوتایپ ۱۴۰۰ · ساخته‌شده با Nuxt
      </p>
    </footer>
  </div>
</template>

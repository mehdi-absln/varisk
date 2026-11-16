<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

usePageSeo({
  title: `پروژه‌های من — ${SITE_NAME}`,
  description: 'پرتفوی‌های ذخیره‌شدهٔ شما.',
  path: '/portfolios',
})

const { user } = useAuth()

const { data, pending, error, refresh } = await useFetch('/api/portfolios')
const portfolios = computed(() => data.value?.portfolios ?? [])

/**
 * Deleting asks first, inline. A row that is about to disappear should say so
 * where it is, not in a browser dialog that covers the list it belongs to.
 */
const confirming = ref<number | null>(null)
const working = ref<number | null>(null)

async function remove(id: number) {
  working.value = id
  try {
    await $fetch(`/api/portfolios/${id}`, { method: 'DELETE' })
    await refresh()
  }
  finally {
    working.value = null
    confirming.value = null
  }
}
</script>

<template>
  <div>
    <!-- ── Page head ────────────────────────────────────────────────────── -->
    <section class="relative overflow-hidden border-b border-line">
      <div class="absolute inset-0 grid-field pointer-events-none" aria-hidden="true" />
      <div class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div class="flex flex-wrap items-end justify-between gap-5">
          <div>
            <span class="chip">{{ user?.name }}</span>
            <h1 class="text-2xl sm:text-[2rem] font-extrabold tracking-tight mt-4">پروژه‌های من</h1>
            <p class="text-ink-2 text-sm leading-8 mt-2 max-w-lg">
              هر پرتفوی همان‌طور که ذخیره شده باز می‌شود و دوباره در مرورگر شما محاسبه می‌گردد.
            </p>
          </div>

          <NuxtLink to="/calculate" class="tap btn btn-primary py-2 px-4 text-[0.82rem]">
            پرتفوی تازه
          </NuxtLink>
        </div>
      </div>
    </section>

    <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
      <p v-if="pending" class="text-sm text-ink-3">در حال بارگذاری…</p>

      <p v-else-if="error" class="text-sm text-risk">
        فهرست پرتفوی‌ها خوانده نشد. صفحه را دوباره باز کنید.
      </p>

      <!--
        Empty state, in the spirit of the notice beside the stock list on the
        calculate page: a first-time user is told what to do next, not shown a
        blank panel and left to guess.
      -->
      <div
        v-else-if="!portfolios.length"
        class="panel p-8 sm:p-10 text-center"
      >
        <p class="text-base font-extrabold tracking-tight">هنوز پرتفویی ذخیره نکرده‌اید</p>
        <p class="text-ink-2 text-sm leading-8 mt-3 max-w-md mx-auto">
          یک پرتفوی بسازید و وقتی عدد ارزش در معرض خطر روی صفحه آمد، دکمهٔ «ذخیره» کنار همان عدد ظاهر می‌شود.
        </p>
        <NuxtLink to="/calculate" class="tap btn btn-primary py-2 px-5 mt-6">
          شروع محاسبه
        </NuxtLink>
      </div>

      <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 [&>*]:min-w-0">
        <article
          v-for="p in portfolios"
          :key="p.id"
          class="panel panel-lift p-5 flex flex-col"
        >
          <h2 class="text-base font-extrabold tracking-tight leading-7">{{ p.title }}</h2>

          <dl class="mt-4 space-y-2 text-sm">
            <div class="flex items-baseline justify-between gap-3">
              <dt class="text-ink-3 text-xs">تعداد سهم</dt>
              <dd class="num font-semibold">{{ faInt(p.stockCount) }}</dd>
            </div>
            <div class="flex items-baseline justify-between gap-3">
              <dt class="text-ink-3 text-xs">ارزش کل</dt>
              <dd class="num font-semibold">{{ faToman(p.totalValue) }}</dd>
            </div>
            <div class="flex items-baseline justify-between gap-3">
              <dt class="text-ink-3 text-xs">آخرین ذخیره</dt>
              <dd class="num text-ink-2">{{ faDate(p.updatedAt) }}</dd>
            </div>
          </dl>

          <div class="flex items-center gap-2 pt-4 mt-auto border-t border-line-soft">
            <NuxtLink
              :to="`/calculate?portfolio=${p.id}`"
              class="tap btn btn-ghost py-1.5 px-3.5 text-[0.8rem]"
            >
              باز کردن
            </NuxtLink>

            <template v-if="confirming === p.id">
              <button
                type="button"
                class="tap btn btn-ghost py-1.5 px-3.5 text-[0.8rem] text-risk border-risk/40"
                :disabled="working === p.id"
                @click="remove(p.id)"
              >
                {{ working === p.id ? 'در حال حذف…' : 'حذف شود' }}
              </button>
              <button
                type="button"
                class="tap text-xs text-ink-3 hover:text-ink px-1"
                @click="confirming = null"
              >
                انصراف
              </button>
            </template>

            <button
              v-else
              type="button"
              class="tap mr-auto text-xs text-ink-3 hover:text-risk transition-colors px-1"
              @click="confirming = p.id"
            >
              حذف
            </button>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

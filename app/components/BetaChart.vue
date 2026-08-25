<script setup lang="ts">
const props = defineProps<{ names: string[], betas: number[], weights: number[] }>()

/** Headroom above the tallest bar so the market line is never at the edge. */
const max = computed(() => Math.max(1.25, ...props.betas) * 1.12)

const portfolioBeta = computed(() =>
  props.betas.reduce((acc, b, i) => acc + b * props.weights[i]!, 0),
)

const rows = computed(() =>
  props.names.map((name, i) => {
    const beta = props.betas[i]!
    return {
      name,
      beta,
      width: `${(beta / max.value) * 100}%`,
      // Above 1 the stock amplifies the market — the only thing worth colouring.
      aggressive: beta > 1,
    }
  }),
)

const marketLine = computed(() => `${(1 / max.value) * 100}%`)
</script>

<template>
  <section class="panel p-6 sm:p-7">
    <div class="flex items-start justify-between gap-4 mb-6">
      <div>
        <h3 class="text-lg font-extrabold tracking-tight">بتا نسبت به بازار</h3>
        <p class="text-ink-3 text-xs mt-1.5 leading-6">بتای بالای ۱ یعنی سهم نوسان بازار را تشدید می‌کند.</p>
      </div>
      <div class="shrink-0 text-end">
        <p class="eyebrow">بتای پرتفوی</p>
        <p class="figure text-2xl mt-1.5" :class="portfolioBeta > 1 ? 'text-risk' : 'text-ink'">
          {{ faDecimal(portfolioBeta, 2) }}
        </p>
      </div>
    </div>

    <div class="relative pt-5">
      <!-- Market reference at β = 1 -->
      <div
        class="absolute inset-y-0 top-3 border-r border-dashed border-ink-3/50 pointer-events-none z-10"
        :style="{ insetInlineStart: marketLine }"
      >
        <span class="absolute top-0 -translate-y-full -translate-x-1/2 text-[0.62rem] text-ink-3 whitespace-nowrap num">
          بازار ۱٫۰۰
        </span>
      </div>

      <div class="space-y-3">
        <div v-for="r in rows" :key="r.name" class="flex items-center gap-3">
          <span class="w-24 sm:w-28 shrink-0 text-xs text-ink-2 truncate" :title="r.name">{{ r.name }}</span>
          <div class="flex-1 h-6 rounded-md bg-bg-soft overflow-hidden">
            <div
              class="h-full rounded-md transition-[width] duration-500 ease-out"
              :class="r.aggressive ? 'bg-risk/70' : 'bg-brand/60'"
              :style="{ width: r.width }"
            />
          </div>
          <span
            class="w-10 shrink-0 text-xs font-bold text-end num"
            :class="r.aggressive ? 'text-risk' : 'text-ink'"
          >
            {{ faDecimal(r.beta, 2) }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

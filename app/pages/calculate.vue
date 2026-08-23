<script setup lang="ts">
useSeoMeta({ title: 'محاسبهٔ ریسک — شلیل اپ' })

interface Stock {
  name: string
  value: number | null
  weight: number
}

const stocks = ref<Stock[]>([{ name: '', value: null, weight: 100 }])

function addStock() {
  stocks.value.push({ name: '', value: null, weight: 0 })
}
function removeStock(i: number) {
  stocks.value.splice(i, 1)
}
</script>

<template>
  <section class="max-w-3xl mx-auto px-5 py-14">
    <h1 class="text-2xl font-extrabold mb-2">پرتفوی خود را وارد کنید</h1>
    <p class="text-mist text-sm mb-8">
      نام و ارزش تومانی هر سهم را بنویسید؛ محاسبات به‌زودی در همین صفحه انجام می‌شود.
    </p>

    <div class="space-y-3">
      <div
        v-for="(s, i) in stocks"
        :key="i"
        class="flex items-center gap-3 rounded-xl border border-edge bg-panel p-3"
      >
        <span class="w-7 h-7 shrink-0 rounded-md bg-panel2 border border-edge grid place-items-center text-teal text-xs font-bold">
          {{ i + 1 }}
        </span>
        <input
          v-model="s.name"
          type="text"
          placeholder="نام سهم (مثلاً فولاد)"
          class="flex-1 bg-transparent outline-none text-sm placeholder:text-mist/60"
        >
        <input
          v-model.number="s.value"
          type="number"
          min="0"
          placeholder="ارزش (تومان)"
          dir="ltr"
          class="w-36 bg-transparent outline-none text-sm text-left placeholder:text-mist/60"
        >
        <button
          class="text-coral/70 hover:text-coral transition-colors text-lg leading-none px-1"
          :disabled="stocks.length === 1"
          title="حذف سهم"
          @click="removeStock(i)"
        >
          ×
        </button>
      </div>
    </div>

    <button
      class="mt-4 w-full py-3 rounded-xl border border-dashed border-edge text-mist hover:text-teal hover:border-teal/50 transition-colors text-sm"
      @click="addStock"
    >
      + افزودن سهم
    </button>

    <div class="mt-10 rounded-xl border border-edge bg-panel2/50 p-5 text-center text-mist text-sm leading-7">
      🚧 موتور محاسبات VaR در فاز بعدی نقشه راه اضافه می‌شود — فعلاً فقط ساختار فرم آماده است.
    </div>
  </section>
</template>

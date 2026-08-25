<script setup lang="ts">
import type { ParsedTable } from '~/utils/parseTable'

const emit = defineEmits<{ parsed: [table: ParsedTable, fileName: string] }>()

const input = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
const error = ref('')
const loaded = ref<{ name: string, columns: number, rows: number } | null>(null)

const ACCEPT = '.csv,.tsv,.txt,text/csv,text/plain'
const MAX_BYTES = 2 * 1024 * 1024

async function handle(file: File | undefined) {
  error.value = ''
  if (!file) return

  if (file.size > MAX_BYTES) {
    error.value = 'فایل بزرگ‌تر از ۲ مگابایت است.'
    return
  }

  // Anything readable as text is fine; xlsx is binary and cannot be, so say so
  // rather than handing the parser bytes it will silently mangle.
  if (/\.(xlsx|xls)$/i.test(file.name)) {
    error.value = 'فایل اکسل مستقیم خوانده نمی‌شود — از اکسل، CSV خروجی بگیرید.'
    return
  }

  const table = parsePriceTable(await file.text())
  if (!table.columns.length) {
    error.value = table.notes[0] ?? 'ستون عددی در فایل پیدا نشد.'
    return
  }

  loaded.value = { name: file.name, columns: table.columns.length, rows: table.rows }
  emit('parsed', table, file.name)
}

function onDrop(e: DragEvent) {
  dragging.value = false
  handle(e.dataTransfer?.files?.[0])
}

function onPick(e: Event) {
  handle((e.target as HTMLInputElement).files?.[0])
  // Reset so picking the same file twice still fires a change event.
  ;(e.target as HTMLInputElement).value = ''
}
</script>

<template>
  <div>
    <div
      class="rounded-xl border border-dashed px-5 py-8 text-center cursor-pointer transition-colors"
      :class="dragging
        ? 'border-brand bg-brand/5'
        : 'border-line hover:border-brand/50 hover:bg-card-hi bg-bg-soft/50'"
      role="button"
      tabindex="0"
      @click="input?.click()"
      @keydown.enter.prevent="input?.click()"
      @keydown.space.prevent="input?.click()"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <span
        class="grid place-items-center w-11 h-11 mx-auto rounded-xl transition-colors"
        :class="dragging ? 'bg-brand text-brand-ink' : 'bg-card text-ink-3 border border-line'"
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 16V4M8 8l4-4 4 4" />
          <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
        </svg>
      </span>

      <p class="text-sm font-bold mt-3">فایل‌های خود را اینجا رها کنید</p>
      <p class="text-xs text-ink-3 mt-1.5 leading-7">
        یا روی این کادر کلیک کنید — CSV یا TSV،<br>
        هر ستون یک سهم، هر سطر یک روز.
      </p>

      <input
        ref="input"
        type="file"
        :accept="ACCEPT"
        class="hidden"
        @change="onPick"
      >
    </div>

    <p v-if="error" class="text-risk text-xs mt-2.5">{{ error }}</p>
    <p v-else-if="loaded" class="text-gain text-xs mt-2.5">
      «{{ loaded.name }}» خوانده شد —
      {{ faInt(loaded.columns) }} ستون، {{ faInt(loaded.rows) }} سطر.
    </p>
  </div>
</template>

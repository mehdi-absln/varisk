<script setup lang="ts">
/**
 * The frame both auth forms sit in.
 *
 * Everything the two pages share — the column, the panel, the heading pair, the
 * error block, the submit button and the footer link — so what is left in each
 * page is only its own fields and its own rules.
 */
defineProps<{
  eyebrow: string
  title: string
  subtitle: string
  submitLabel: string
  pending: boolean
  /** What stands between this form and an account, in the user's words. */
  issues: string[]
}>()

defineEmits<{ submit: [] }>()
</script>

<template>
  <div class="relative overflow-hidden">
    <div class="absolute inset-0 grid-field pointer-events-none" aria-hidden="true" />

    <div class="relative z-10 max-w-md mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div class="panel p-6 sm:p-8">
        <p class="eyebrow">{{ eyebrow }}</p>
        <h1 class="text-2xl font-extrabold tracking-tight mt-3">{{ title }}</h1>
        <p class="text-ink-2 text-sm leading-8 mt-2">{{ subtitle }}</p>

        <form class="mt-7 space-y-4" @submit.prevent="$emit('submit')">
          <slot />

          <!-- Same shape as the row messages on the calculate page. -->
          <ul v-if="issues.length" class="space-y-1.5 pt-1">
            <li
              v-for="message in issues"
              :key="message"
              class="flex items-start gap-2 text-risk text-xs leading-6"
            >
              <svg
                width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2.4" stroke-linecap="round" class="mt-1 shrink-0" aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" /><path d="M12 8v4.5M12 16h.01" />
              </svg>
              <span>{{ message }}</span>
            </li>
          </ul>

          <button
            type="submit"
            class="tap btn btn-primary w-full justify-center py-2.5"
            :disabled="pending"
          >
            {{ pending ? 'کمی صبر کنید…' : submitLabel }}
          </button>
        </form>
      </div>

      <p class="text-center text-sm text-ink-3 mt-6">
        <slot name="footer" />
      </p>
    </div>
  </div>
</template>

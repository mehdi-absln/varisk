<script setup lang="ts">
import { signInSchema } from '#shared/utils/authSchema'

definePageMeta({ middleware: 'guest' })

usePageSeo({
  title: `ورود — ${SITE_NAME}`,
  description: 'به حساب خود وارد شوید تا پرتفوی‌های ذخیره‌شده‌تان را ببینید.',
  path: '/auth/signin',
})

const route = useRoute()
const { signIn } = useAuth()

const email = ref('')
const password = ref('')
const issues = ref<string[]>([])
const pending = ref(false)

/**
 * Where to land afterwards. Only a path from this site is honoured — an
 * absolute URL in a query parameter is somebody else's redirect, not ours.
 */
const next = computed(() => {
  const value = route.query.next
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : '/portfolios'
})

async function submit() {
  const parsed = signInSchema.safeParse({ email: email.value, password: password.value })
  if (!parsed.success) {
    issues.value = parsed.error.issues.map(i => i.message)
    return
  }

  issues.value = []
  pending.value = true
  try {
    await signIn(parsed.data)
    await navigateTo(next.value)
  }
  catch (error) {
    issues.value = [(error as Error).message]
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <AuthPanel
    eyebrow="حساب کاربری"
    title="ورود"
    subtitle="برای دیدن پرتفوی‌های ذخیره‌شده وارد شوید. محاسبه بدون ورود هم کار می‌کند."
    submit-label="ورود"
    :pending="pending"
    :issues="issues"
    @submit="submit"
  >
    <label class="block">
      <span class="block text-xs text-ink-3 mb-1.5">ایمیل</span>
      <input v-model="email" type="email" autocomplete="email" dir="ltr" class="field text-left">
    </label>

    <label class="block">
      <span class="block text-xs text-ink-3 mb-1.5">رمز عبور</span>
      <input
        v-model="password"
        type="password"
        autocomplete="current-password"
        dir="ltr"
        class="field text-left"
      >
    </label>

    <template #footer>
      حساب ندارید؟
      <NuxtLink to="/auth/signup" class="text-brand font-semibold hover:underline">ثبت‌نام کنید</NuxtLink>
    </template>
  </AuthPanel>
</template>

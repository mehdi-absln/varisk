<script setup lang="ts">
import { MIN_PASSWORD, signUpSchema } from '#shared/utils/authSchema'

definePageMeta({ middleware: 'guest' })

usePageSeo({
  title: `ثبت‌نام — ${SITE_NAME}`,
  description: 'حساب بسازید تا پرتفوی‌هایتان بماند و بعداً با یک کلیک باز شود.',
  path: '/auth/signup',
})

const { signUp } = useAuth()

const name = ref('')
const email = ref('')
const password = ref('')
const issues = ref<string[]>([])
const pending = ref(false)

async function submit() {
  const parsed = signUpSchema.safeParse({
    name: name.value,
    email: email.value,
    password: password.value,
  })
  if (!parsed.success) {
    issues.value = parsed.error.issues.map(i => i.message)
    return
  }

  issues.value = []
  pending.value = true
  try {
    await signUp(parsed.data)
    await navigateTo('/portfolios')
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
    title="ثبت‌نام"
    subtitle="فقط برای ذخیرهٔ پرتفوی. سری قیمت‌ها همچنان در مرورگر شما محاسبه می‌شوند."
    submit-label="ساخت حساب"
    :pending="pending"
    :issues="issues"
    @submit="submit"
  >
    <label class="block">
      <span class="block text-xs text-ink-3 mb-1.5">نام</span>
      <input v-model="name" type="text" autocomplete="name" class="field">
    </label>

    <label class="block">
      <span class="block text-xs text-ink-3 mb-1.5">ایمیل</span>
      <input v-model="email" type="email" autocomplete="email" dir="ltr" class="field text-left">
    </label>

    <label class="block">
      <span class="block text-xs text-ink-3 mb-1.5">رمز عبور</span>
      <input
        v-model="password"
        type="password"
        autocomplete="new-password"
        dir="ltr"
        class="field text-left"
      >
      <span class="block text-xs text-ink-3 mt-1.5 leading-6">
        دست‌کم {{ faInt(MIN_PASSWORD) }} نویسه.
      </span>
    </label>

    <template #footer>
      حساب دارید؟
      <NuxtLink to="/auth/signin" class="text-brand font-semibold hover:underline">وارد شوید</NuxtLink>
    </template>
  </AuthPanel>
</template>

import { z } from 'zod'
import { toPersianDigits } from './format'

/**
 * What a sign-up and a sign-in have to look like.
 *
 * In `shared/` so the form and the API check the same rules against the same
 * strings: a message the user reads under a field is the message the server
 * would have sent back, and neither can drift from the other.
 *
 * Messages are a named block rather than literals at the call sites, the way
 * `ROW_MESSAGES` and `FORM_MESSAGES` are in `app/utils/portfolioSchema.ts` —
 * the copy is then greppable, and a test can assert on it by name.
 */

/** Short enough to be typed on a phone, long enough to be worth hashing. */
export const MIN_PASSWORD = 8

export const AUTH_MESSAGES = {
  name: 'نام خود را وارد کنید.',
  nameLong: 'نام نباید بلندتر از ۶۰ نویسه باشد.',
  email: 'ایمیل معتبر وارد کنید.',
  password: `رمز عبور باید دست‌کم ${toPersianDigits(MIN_PASSWORD)} نویسه باشد.`,
  passwordLong: 'رمز عبور بیش از حد بلند است.',
  passwordRequired: 'رمز عبور را وارد کنید.',
  // Deliberately says nothing about which half was wrong: telling a stranger
  // that an address exists is telling them half of an account.
  credentials: 'ایمیل یا رمز عبور درست نیست.',
  emailTaken: 'حسابی با این ایمیل از قبل ساخته شده است.',
  unauthenticated: 'برای این کار باید وارد شوید.',
} as const

/**
 * Normalised before it is checked, and stored the way it was checked. Two
 * people typing the same address with different capitalisation are one person,
 * and the unique index has to agree with that.
 */
const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email(AUTH_MESSAGES.email))

// bcrypt only reads the first 72 bytes, so anything past that is silently not
// part of the password. Refused rather than truncated.
const password = z
  .string()
  .min(MIN_PASSWORD, AUTH_MESSAGES.password)
  .max(72, AUTH_MESSAGES.passwordLong)

export const signUpSchema = z.object({
  name: z.string().trim().min(1, AUTH_MESSAGES.name).max(60, AUTH_MESSAGES.nameLong),
  email,
  password,
})

export const signInSchema = z.object({
  email,
  // Not the sign-up rule: an existing password that predates a rule change
  // still has to be typeable, and the answer either way is `credentials`.
  password: z.string().min(1, AUTH_MESSAGES.passwordRequired),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>

/** The user as every response returns them. Never carries the password hash. */
export interface PublicUser {
  id: number
  name: string
  email: string
  role: string
}

import { describe, expect, it } from 'vitest'
import { AUTH_MESSAGES, signInSchema, signUpSchema } from '../shared/utils/authSchema'

describe('signUpSchema', () => {
  const valid = { name: 'مهدی آبسالان', email: 'a@b.ir', password: 'longenough' }

  it('accepts a complete sign-up', () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true)
  })

  it('normalises the address, so one person is one row', () => {
    const parsed = signUpSchema.parse({ ...valid, email: '  Mehdi@Example.IR ' })
    expect(parsed.email).toBe('mehdi@example.ir')
  })

  it('trims the name rather than storing the spaces', () => {
    expect(signUpSchema.parse({ ...valid, name: '  مهدی  ' }).name).toBe('مهدی')
  })

  it('rejects a name of nothing but spaces', () => {
    const result = signUpSchema.safeParse({ ...valid, name: '   ' })
    expect(result.error?.issues[0]?.message).toBe(AUTH_MESSAGES.name)
  })

  it('rejects an address that is not one', () => {
    const result = signUpSchema.safeParse({ ...valid, email: 'mehdi@' })
    expect(result.error?.issues[0]?.message).toBe(AUTH_MESSAGES.email)
  })

  it('rejects a password shorter than the floor', () => {
    const result = signUpSchema.safeParse({ ...valid, password: 'short12' })
    expect(result.error?.issues[0]?.message).toBe(AUTH_MESSAGES.password)
  })

  it('states the floor in Persian digits, like every other number the user reads', () => {
    expect(AUTH_MESSAGES.password).toContain('۸')
  })

  it('refuses a password past what bcrypt would read, instead of truncating it', () => {
    const result = signUpSchema.safeParse({ ...valid, password: 'a'.repeat(73) })
    expect(result.error?.issues[0]?.message).toBe(AUTH_MESSAGES.passwordLong)
  })
})

describe('signInSchema', () => {
  it('accepts any non-empty password, so a rule change cannot lock an account out', () => {
    expect(signInSchema.safeParse({ email: 'a@b.ir', password: 'old' }).success).toBe(true)
  })

  it('still requires one', () => {
    const result = signInSchema.safeParse({ email: 'a@b.ir', password: '' })
    expect(result.error?.issues[0]?.message).toBe(AUTH_MESSAGES.passwordRequired)
  })

  it('normalises the address the same way sign-up did', () => {
    expect(signInSchema.parse({ email: ' A@B.IR ', password: 'x' }).email).toBe('a@b.ir')
  })
})

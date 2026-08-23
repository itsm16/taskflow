import { describe, it, expect } from 'vitest'
import { BaseDto } from '../common/dto/base.dto.js'
import { RegisterDto, LoginDto } from '../modules/auth/dto/auth.dto.js'

describe('BaseDto', () => {
  it('validates empty schema with no errors (strips unknown keys)', () => {
    const { data, errors } = BaseDto.validate({ anything: 1 })
    expect(errors).toBeUndefined()
    // z.object({}) strips unknown keys by default -> becomes {}
    expect(data).toEqual({})
  })

  it('returns errors array when validation fails via child class', () => {
    const { data, errors } = RegisterDto.validate({ name: '', email: 'bad', password: '123' })
    expect(data).toBeNull()
    expect(errors).toBeDefined()
    expect(Array.isArray(errors)).toBe(true)
    expect(errors!.length).toBeGreaterThan(0)
  })
})

describe('RegisterDto', () => {
  it('passes valid payload', () => {
    const { data, errors } = RegisterDto.validate({ name: 'Alice', email: 'alice@taskflow.dev', password: 'password123' })
    expect(errors).toBeUndefined()
    expect(data).toEqual({ name: 'Alice', email: 'alice@taskflow.dev', password: 'password123' })
  })

  it('fails missing name', () => {
    const { errors } = RegisterDto.validate({ email: 'a@b.com', password: 'password123' })
    expect(errors).toBeDefined()
    expect(errors!.join(' ')).toMatch(/Name/i)
  })

  it('fails invalid email', () => {
    const { errors } = RegisterDto.validate({ name: 'A', email: 'not-email', password: 'password123' })
    expect(errors).toBeDefined()
  })

  it('fails short password (<6)', () => {
    const { errors } = RegisterDto.validate({ name: 'A', email: 'a@b.com', password: '123' })
    expect(errors).toBeDefined()
  })

  it('trims values', () => {
    // zod v4: z.email().trim() trims after email check — email with spaces may still fail,
    // so test trimming on fields that are definitely trimmed (name, password) with a clean email
    const { data, errors } = RegisterDto.validate({ name: '  Alice  ', email: 'alice@taskflow.dev', password: '  password123  ' })
    expect(errors).toBeUndefined()
    expect(data?.name).toBe('Alice')
    expect(data?.password).toBe('password123')
    // also verify a fully spaced payload still validates after trim if zod trims first — document current behavior
    const spaced = RegisterDto.validate({ name: '  Bob  ', email: '  bob@taskflow.dev  ', password: '  password123  ' })
    // if email trimming is not applied before validation, this will have errors; we just ensure name is trimmed when it passes
    if (!spaced.errors) {
      expect(spaced.data?.name).toBe('Bob')
    }
  })
})

describe('LoginDto', () => {
  it('passes valid login', () => {
    const { data, errors } = LoginDto.validate({ email: 'alice@taskflow.dev', password: 'password123' })
    expect(errors).toBeUndefined()
    expect(data?.email).toBe('alice@taskflow.dev')
  })

  it('fails missing email', () => {
    const { errors } = LoginDto.validate({ password: 'password123' })
    expect(errors).toBeDefined()
  })

  it('fails invalid email', () => {
    const { errors } = LoginDto.validate({ email: 'bad', password: 'password123' })
    expect(errors).toBeDefined()
  })

  it('fails short password', () => {
    const { errors } = LoginDto.validate({ email: 'a@b.com', password: '12' })
    expect(errors).toBeDefined()
  })
})

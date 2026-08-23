import { describe, it, expect, vi } from 'vitest'
import { validate } from '../common/middleware/validate.middleware.js'
import { BaseDto } from '../common/dto/base.dto.js'
import ApiError from '../common/utils/api-error.js'
import { RegisterDto } from '../modules/auth/dto/auth.dto.js'

function mockReq(body: any) {
  return { body } as any
}
function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() } as any
}

describe('validate middleware', () => {
  it('calls next when validation passes', () => {
    const next = vi.fn()
    const mw = validate(RegisterDto)
    mw(mockReq({ name: 'Alice', email: 'alice@taskflow.dev', password: 'password123' }), mockRes(), next)
    expect(next).toHaveBeenCalledOnce()
  })

  it('returns ApiError when validation fails (current impl returns error instead of next(err))', () => {
    const next = vi.fn()
    const mw = validate(RegisterDto)
    const result = mw(mockReq({ name: '', email: 'bad', password: '123' }), mockRes(), next)
    // current implementation does `return ApiError.badRequest(...)` without calling next or res
    expect(result).toBeInstanceOf(ApiError)
    expect((result as ApiError).statusCode).toBe(400)
    expect(next).not.toHaveBeenCalled()
  })

  it('produces joined error message', () => {
    const next = vi.fn()
    const mw = validate(RegisterDto)
    const result: any = mw(mockReq({}), mockRes(), next)
    expect(result.message).toContain(',')
    // empty body triggers multiple issues joined by ", "
  })

  it('works with generic BaseDto (no errors)', () => {
    const next = vi.fn()
    const mw = validate(BaseDto)
    mw(mockReq({ anything: 1 }), mockRes(), next)
    expect(next).toHaveBeenCalled()
  })
})

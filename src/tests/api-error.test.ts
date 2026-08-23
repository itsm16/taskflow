import { describe, it, expect } from 'vitest'
import ApiError from '../common/utils/api-error.js'

describe('ApiError', () => {
  it('creates error with statusCode and message', () => {
    const err = new ApiError(400, 'Bad')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.statusCode).toBe(400)
    expect(err.message).toBe('Bad')
    expect(err.isOperational).toBe(true)
    expect(err.stack).toBeDefined()
  })

  it('static badRequest defaults and custom', () => {
    expect(ApiError.badRequest().statusCode).toBe(400)
    expect(ApiError.badRequest().message).toBe('Bad Request')
    expect(ApiError.badRequest('oops').message).toBe('oops')
  })

  it('static unauthorized', () => {
    const e = ApiError.unauthorized()
    expect(e.statusCode).toBe(401)
    expect(e.message).toBe('Unauthorized')
    expect(ApiError.unauthorized('nope').message).toBe('nope')
  })

  it('static forbidden', () => {
    expect(ApiError.forbidden().statusCode).toBe(403)
    expect(ApiError.forbidden('denied').message).toBe('denied')
  })

  it('static notFound', () => {
    expect(ApiError.notFound().statusCode).toBe(404)
    expect(ApiError.notFound().message).toBe('Not found')
  })

  it('static conflict', () => {
    expect(ApiError.conflict().statusCode).toBe(409)
    expect(ApiError.conflict('dup').message).toBe('dup')
  })

  it('static internal', () => {
    expect(ApiError.internal().statusCode).toBe(500)
    expect(ApiError.internal('boom').message).toBe('boom')
  })
})

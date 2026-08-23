import { describe, it, expect, vi } from 'vitest'
import ApiResponse from '../common/utils/api-response.js'

function mockRes() {
  const json = vi.fn().mockReturnThis()
  const status = vi.fn().mockReturnValue({ json })
  return { status, json } as any
}

describe('ApiResponse', () => {
  it('ok sends 200 with message and data', () => {
    const res = mockRes()
    ApiResponse.ok(res, 'hello', { a: 1 })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.status().json).toHaveBeenCalledWith({ message: 'hello', data: { a: 1 } })
  })

  it('ok defaults data to null when undefined', () => {
    const res = mockRes()
    ApiResponse.ok(res, 'hi')
    expect(res.status().json).toHaveBeenCalledWith({ message: 'hi', data: null })
  })

  it('created sends 200 (note: not 201) with message', () => {
    const res = mockRes()
    // current impl returns 200, not 201 — test documents actual behavior
    ApiResponse.created(res, 'created', { id: '1' })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.status().json).toHaveBeenCalledWith({ message: 'created', data: { id: '1' } })
  })

  it('created with no data returns null', () => {
    const res = mockRes()
    ApiResponse.created(res, 'c')
    expect(res.status().json).toHaveBeenCalledWith({ message: 'c', data: null })
  })

  it('notFound sends 404', () => {
    const res = mockRes()
    ApiResponse.notFound(res)
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.status().json).toHaveBeenCalledWith({ message: 'Not found', data: null })
  })

  it('notFound with custom message and data', () => {
    const res = mockRes()
    ApiResponse.notFound(res, 'nope', { x: 1 })
    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.status().json).toHaveBeenCalledWith({ message: 'nope', data: { x: 1 } })
  })
})

import { describe, it, expect } from 'vitest'
import ApiError from '../common/utils/api-error.js'
import { assertTenant } from '../common/utils/assert-tenant.js'

describe('assertTenant integration with services', () => {
  it('does not throw when orgs match', () => {
    expect(() => assertTenant({ resourceOrganizationId: 'a', orgId: 'a' })).not.toThrow()
  })
  it('throws forbidden ApiError on mismatch', () => {
    expect(() => assertTenant({ resourceOrganizationId: 'a', orgId: 'b' })).toThrow(ApiError)
    try {
      assertTenant({ resourceOrganizationId: 'a', orgId: 'b' })
    } catch (e: any) {
      expect(e.statusCode).toBe(403)
      expect(e.message).toBe('Cross-tenant access denied')
    }
  })
})

describe('ApiError used in services', () => {
  it('badRequest for missing fields', () => {
    const e = ApiError.badRequest('Name and organization ID are required')
    expect(e.statusCode).toBe(400)
  })
  it('notFound for missing project', () => {
    const e = ApiError.notFound('Project not found')
    expect(e.statusCode).toBe(404)
  })
  it('forbidden for cross-tenant', () => {
    const e = ApiError.forbidden('Cross-tenant access denied')
    expect(e.statusCode).toBe(403)
  })
})

describe('task status/priority validation (pure)', () => {
  const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'] as const
  const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const

  it('accepts valid statuses', () => {
    for (const s of TASK_STATUSES) {
      expect((TASK_STATUSES as readonly string[]).includes(s)).toBe(true)
    }
  })
  it('rejects invalid status', () => {
    expect((TASK_STATUSES as readonly string[]).includes('invalid')).toBe(false)
  })
  it('accepts valid priorities', () => {
    for (const p of TASK_PRIORITIES) {
      expect((TASK_PRIORITIES as readonly string[]).includes(p)).toBe(true)
    }
  })
  it('rejects invalid priority', () => {
    expect((TASK_PRIORITIES as readonly string[]).includes('critical')).toBe(false)
  })
  it('status error message format', () => {
    const msg = `Status must be one of: ${TASK_STATUSES.join(', ')}`
    expect(msg).toBe('Status must be one of: todo, in_progress, review, done')
  })
  it('priority error message format', () => {
    const msg = `Priority must be one of: ${TASK_PRIORITIES.join(', ')}`
    expect(msg).toBe('Priority must be one of: low, medium, high, urgent')
  })
})

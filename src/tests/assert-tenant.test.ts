import { describe, it, expect } from 'vitest'
import { assertTenant } from '../common/utils/assert-tenant.js'
import ApiError from '../common/utils/api-error.js'

describe('assertTenant', () => {
  it('does not throw when orgs match', () => {
    expect(() => assertTenant({ resourceOrganizationId: 'org-1', orgId: 'org-1' })).not.toThrow()
  })

  it('throws forbidden ApiError when orgs differ', () => {
    try {
      assertTenant({ resourceOrganizationId: 'org-1', orgId: 'org-2' })
      throw new Error('should have thrown')
    } catch (e: any) {
      expect(e).toBeInstanceOf(ApiError)
      expect(e.statusCode).toBe(403)
      expect(e.message).toBe('Cross-tenant access denied')
    }
  })

  it('is case-sensitive', () => {
    expect(() => assertTenant({ resourceOrganizationId: 'Org-1', orgId: 'org-1' })).toThrow()
  })
})

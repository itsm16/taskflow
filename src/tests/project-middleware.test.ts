import { describe, it, expect, vi } from 'vitest'

const { mockLimit } = vi.hoisted(() => {
  const mockLimit = vi.fn().mockResolvedValue([{ id: 'm1' }])
  const mockWhere = vi.fn(() => ({ limit: mockLimit }))
  const mockFrom = vi.fn(() => ({ where: mockWhere }))
  const mockSelect = vi.fn(() => ({ from: mockFrom }))
  return { mockLimit, mockWhere, mockFrom, mockSelect }
})

vi.mock('../common/db/index.js', () => {
  const mockLimit = vi.fn().mockResolvedValue([{ id: 'm1' }])
  const mockWhere = vi.fn(() => ({ limit: mockLimit }))
  const mockFrom = vi.fn(() => ({ where: mockWhere }))
  const mockSelect = vi.fn(() => ({ from: mockFrom }))
  return {
    db: { select: mockSelect },
  }
})

vi.mock('drizzle-orm', async (orig) => {
  const actual: any = await orig()
  return { ...actual, eq: vi.fn(), and: vi.fn() }
})

import { checkOrg } from '../modules/project/project.middleware.js'
import { checkOrg as authCheckOrg } from '../modules/auth/auth.middleware.js'

describe('project.middleware', () => {
  it('re-exports checkOrg from auth.middleware', () => {
    expect(checkOrg).toBe(authCheckOrg)
  })

  it('checkOrg from project middleware still enforces org', async () => {
    const req: any = { body: {}, params: {}, query: {}, user: { id: 'u1' } }
    const res: any = { status: vi.fn().mockReturnValue({ json: vi.fn() }) }
    const next = vi.fn()
    await checkOrg()(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
  })
})

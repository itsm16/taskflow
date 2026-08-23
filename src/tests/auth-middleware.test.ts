import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import JWT from 'jsonwebtoken'

const { mockLimit, mockWhere, mockFrom, mockSelect } = vi.hoisted(() => {
  const mockLimit = vi.fn()
  const mockWhere = vi.fn(() => ({ limit: mockLimit }))
  const mockFrom = vi.fn(() => ({ where: mockWhere }))
  const mockSelect = vi.fn(() => ({ from: mockFrom }))
  return { mockLimit, mockWhere, mockFrom, mockSelect }
})

vi.mock('../common/db/index.js', () => ({
  db: {
    select: mockSelect,
  },
}))

vi.mock('drizzle-orm', async (orig) => {
  const actual: any = await orig()
  return {
    ...actual,
    eq: vi.fn((...args) => ({ _eq: args })),
    and: vi.fn((...args) => ({ _and: args })),
  }
})

import { verifyToken, checkToken, checkRole, checkOrg } from '../modules/auth/auth.middleware.js'

const JWT_SECRET = 'test-secret-123'
const originalEnv = process.env.JWT_SECRET

function mockRes() {
  const json = vi.fn().mockReturnValue({})
  const status = vi.fn().mockReturnValue({ json })
  return { status, json } as any
}

describe('verifyToken', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET
  })
  afterEach(() => {
    process.env.JWT_SECRET = originalEnv
  })

  it('verifies valid token', () => {
    const payload = { id: 'u1', email: 'a@b.com', org_id: 'org1' }
    const token = JWT.sign(payload, JWT_SECRET)
    const decoded: any = verifyToken(token)
    expect(decoded.id).toBe('u1')
    expect(decoded.email).toBe('a@b.com')
  })

  it('throws on invalid token', () => {
    expect(() => verifyToken('invalid.token.here')).toThrow()
  })

  it('throws when signed with different secret', () => {
    const token = JWT.sign({ id: 'u1' }, 'other-secret')
    expect(() => verifyToken(token)).toThrow()
  })
})

describe('checkToken middleware', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET
    vi.clearAllMocks()
  })
  afterEach(() => {
    process.env.JWT_SECRET = originalEnv
  })

  it('401 when no token in cookies', async () => {
    const req: any = { cookies: {} }
    const res = mockRes()
    const next = vi.fn()
    const handler = checkToken()
    await handler(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.status().json).toHaveBeenCalledWith({ message: 'Token is required' })
    expect(next).not.toHaveBeenCalled()
  })

  it('401 when cookies.tokens missing', async () => {
    const req: any = { cookies: { tokens: undefined } }
    const res = mockRes()
    const next = vi.fn()
    await checkToken()(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('401 on invalid token', async () => {
    const req: any = { cookies: { tokens: { access_token: 'bad.token' } } }
    const res = mockRes()
    const next = vi.fn()
    await checkToken()(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.status().json).toHaveBeenCalledWith({ message: 'Invalid token' })
  })

  it('401 when user not found in DB', async () => {
    const token = JWT.sign({ id: 'u1', email: 'a@b.com' }, JWT_SECRET)
    const req: any = { cookies: { tokens: { access_token: token } } }
    const res = mockRes()
    const next = vi.fn()
    mockLimit.mockResolvedValueOnce([])
    await checkToken()(req, res, next)
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.status().json).toHaveBeenCalledWith({ message: 'User not found' })
  })

  it('sets req.user and calls next on success', async () => {
    const token = JWT.sign({ id: 'user-123', email: 'alice@taskflow.dev', org_id: 'org-999' }, JWT_SECRET)
    const req: any = { cookies: { tokens: { access_token: token } } }
    const res = mockRes()
    const next = vi.fn()
    const dbUser = { id: 'user-123', name: 'Alice', email: 'alice@taskflow.dev', role: 'org_admin' }
    mockLimit.mockResolvedValueOnce([dbUser])
    await checkToken()(req, res, next)
    expect(next).toHaveBeenCalledOnce()
    expect(req.user).toEqual({
      id: 'user-123',
      name: 'Alice',
      email: 'alice@taskflow.dev',
      org_id: 'org-999',
      role: 'org_admin',
    })
  })

  it('uses decoded.org_id null fallback', async () => {
    const token = JWT.sign({ id: 'u1', email: 'a@b.com' }, JWT_SECRET)
    const req: any = { cookies: { tokens: { access_token: token } } }
    const res = mockRes()
    const next = vi.fn()
    mockLimit.mockResolvedValueOnce([{ id: 'u1', name: 'A', email: 'a@b.com', role: 'member' }])
    await checkToken()(req, res, next)
    expect(req.user.org_id).toBeNull()
  })
})

describe('checkRole middleware', () => {
  it('calls next when role is allowed', () => {
    const req: any = { user: { role: 'org_admin' } }
    const res = mockRes()
    const next = vi.fn()
    checkRole(['org_admin', 'member'])(req, res, next)
    expect(next).toHaveBeenCalledOnce()
  })

  it('403 when role not in allowed list', () => {
    const req: any = { user: { role: 'member' } }
    const res = mockRes()
    const next = vi.fn()
    checkRole(['org_admin'])(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.status().json).toHaveBeenCalledWith({ message: 'Insufficient permissions' })
    expect(next).not.toHaveBeenCalled()
  })

  it('403 when no user/role', () => {
    const req: any = {}
    const res = mockRes()
    const next = vi.fn()
    checkRole(['org_admin'])(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('403 when user null', () => {
    const req: any = { user: null }
    const res = mockRes()
    const next = vi.fn()
    checkRole(['member'])(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
  })
})

describe('checkOrg middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('403 when orgId missing', async () => {
    const req: any = { body: {}, params: {}, query: {}, user: { id: 'u1' } }
    const res = mockRes()
    const next = vi.fn()
    await checkOrg()(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.status().json).toHaveBeenCalledWith({ message: 'Organization ID is required' })
  })

  it('403 when user id missing', async () => {
    const req: any = { body: { orgId: 'org1' }, params: {}, query: {}, user: {} }
    const res = mockRes()
    const next = vi.fn()
    await checkOrg()(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('reads orgId from body, then params.orgId, then query.orgId', async () => {
    const res = mockRes()
    // from params
    mockLimit.mockResolvedValueOnce([{ id: '1' }])
    const next1 = vi.fn()
    await checkOrg()({ body: {}, params: { orgId: 'org-param' }, query: {}, user: { id: 'u1' } } as any, res, next1)
    expect(next1).toHaveBeenCalled()

    mockLimit.mockResolvedValueOnce([{ id: '1' }])
    const next2 = vi.fn()
    await checkOrg()({ body: {}, params: {}, query: { orgId: 'org-query' }, user: { id: 'u1' } } as any, res, next2)
    expect(next2).toHaveBeenCalled()
    expect(mockSelect).toHaveBeenCalled()
  })

  it('403 when not a member of org', async () => {
    const req: any = { body: { orgId: 'org1' }, params: {}, query: {}, user: { id: 'u1' } }
    const res = mockRes()
    const next = vi.fn()
    mockLimit.mockResolvedValueOnce([])
    await checkOrg()(req, res, next)
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.status().json).toHaveBeenCalledWith({ message: 'Insufficient permissions' })
  })

  it('calls next when member exists', async () => {
    const req: any = { body: { orgId: 'org1' }, params: {}, query: {}, user: { id: 'u1' } }
    const res = mockRes()
    const next = vi.fn()
    mockLimit.mockResolvedValueOnce([{ id: 'm1' }])
    await checkOrg()(req, res, next)
    expect(next).toHaveBeenCalledOnce()
  })
})

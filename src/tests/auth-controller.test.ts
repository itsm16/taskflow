import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock auth.service BEFORE importing controller
vi.mock('../modules/auth/auth.service.js', () => ({
  register: vi.fn(),
  login: vi.fn(),
  refresh: vi.fn(),
  logout: vi.fn(),
  addMember: vi.fn(),
  getMembers: vi.fn(),
  updateMember: vi.fn(),
  removeMember: vi.fn(),
}))

vi.mock('../common/utils/api-response.js', async (orig) => {
  const actual: any = await orig()
  return { default: actual.default }
})

import * as authService from '../modules/auth/auth.service.js'
import * as authController from '../modules/auth/auth.controller.js'

function mockRes() {
  const cookie = vi.fn()
  const clearCookie = vi.fn()
  const status = vi.fn().mockReturnValue({ json: vi.fn().mockReturnValue({}) })
  // For ApiResponse we need res.status(...).json ; but controller uses ApiResponse.ok which does res.status().json internally
  // So mock res with status/json plus cookie helpers
  const res: any = {
    cookie,
    clearCookie,
    status,
    json: vi.fn(),
  }
  // Make status return {json} for ApiResponse path
  res.status = vi.fn().mockReturnValue({ json: res.json })
  return res
}

describe('auth.controller', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('register', () => {
    it('calls authService.register and returns 200', async () => {
      const mockUser = { id: '1', email: 'a@b.com' }
      vi.mocked(authService.register).mockResolvedValueOnce(mockUser as any)
      const req: any = { body: { name: 'Alice', email: 'a@b.com', password: 'pwd1234' } }
      const res = mockRes()
      await authController.register(req, res)
      expect(authService.register).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Registration successful' }))
    })
  })

  describe('login', () => {
    it('sets tokens cookie when refreshToken present', async () => {
      const result: any = { user: { id: '1' }, accessToken: 'at', refreshToken: 'rt' }
      vi.mocked(authService.login).mockResolvedValueOnce(result)
      const req: any = { body: { email: 'a@b.com', password: 'pwd' } }
      const res = mockRes()
      await authController.login(req, res)
      expect(res.cookie).toHaveBeenCalledWith('tokens', { access_token: 'at', refresh_token: 'rt' }, expect.objectContaining({ httpOnly: true, path: '/', sameSite: 'lax' }))
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('does not set cookie when no refreshToken', async () => {
      vi.mocked(authService.login).mockResolvedValueOnce({ user: { id: '1' } } as any)
      const req: any = { body: {} }
      const res = mockRes()
      await authController.login(req, res)
      expect(res.cookie).not.toHaveBeenCalled()
    })
  })

  describe('refresh', () => {
    it('refreshes and sets new cookie', async () => {
      vi.mocked(authService.refresh).mockResolvedValueOnce({ accessToken: 'newAt', refreshToken: 'newRt' } as any)
      const req: any = { cookies: { tokens: { refresh_token: 'oldRt' } } }
      const res = mockRes()
      await authController.refresh(req, res)
      expect(authService.refresh).toHaveBeenCalledWith('oldRt')
      expect(res.cookie).toHaveBeenCalledWith('tokens', expect.objectContaining({ access_token: 'newAt' }), expect.any(Object))
    })
  })

  describe('logout', () => {
    it('returns 404 when no cookies', async () => {
      const req: any = { cookies: {} }
      const res = mockRes()
      await authController.logout(req, res)
      expect(res.status).toHaveBeenCalledWith(404)
      // should not call authService.logout nor clearCookie
      expect(authService.logout).not.toHaveBeenCalled()
    })

    it('clears cookie and returns 200 when cookies present', async () => {
      vi.mocked(authService.logout).mockResolvedValueOnce(undefined as any)
      const req: any = { cookies: { tokens: { refresh_token: 'rt' } } }
      const res = mockRes()
      await authController.logout(req, res)
      expect(authService.logout).toHaveBeenCalled()
      expect(res.clearCookie).toHaveBeenCalledWith('tokens', { path: '/' })
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('handles missing tokens key', async () => {
      const req: any = { cookies: { tokens: null } }
      const res = mockRes()
      await authController.logout(req, res)
      expect(res.status).toHaveBeenCalledWith(404)
    })
  })

  describe('members', () => {
    it('addMember delegates to service', async () => {
      const member = { id: 'm1' }
      vi.mocked(authService.addMember).mockResolvedValueOnce(member as any)
      const req: any = { params: { userId: 'u1' }, body: { orgId: 'org1' } }
      const res = mockRes()
      await authController.addMember(req, res)
      expect(authService.addMember).toHaveBeenCalledWith({ userId: 'u1', orgId: 'org1' })
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('getMembers', async () => {
      vi.mocked(authService.getMembers).mockResolvedValueOnce([] as any)
      const req: any = { params: { orgId: 'org1' } }
      const res = mockRes()
      await authController.getMembers(req, res)
      expect(authService.getMembers).toHaveBeenCalledWith({ orgId: 'org1' })
    })

    it('updateMember', async () => {
      vi.mocked(authService.updateMember).mockResolvedValueOnce({ id: 'm1' } as any)
      const req: any = { params: { userId: 'u1' }, body: { orgId: 'org2' } }
      const res = mockRes()
      await authController.updateMember(req, res)
      expect(authService.updateMember).toHaveBeenCalledWith({ userId: 'u1', orgId: 'org2' })
    })

    it('removeMember uses query.orgId', async () => {
      vi.mocked(authService.removeMember).mockResolvedValueOnce({ id: 'm1' } as any)
      const req: any = { params: { userId: 'u1' }, query: { orgId: 'org1' } }
      const res = mockRes()
      await authController.removeMember(req, res)
      expect(authService.removeMember).toHaveBeenCalledWith({ userId: 'u1', orgId: 'org1' })
    })
  })

  describe('cookie helpers: secure flag depends on NODE_ENV', () => {
    it('secure false in non-production', async () => {
      const prev = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      vi.mocked(authService.login).mockResolvedValueOnce({ accessToken: 'a', refreshToken: 'r' } as any)
      const req: any = { body: {} }
      const res = mockRes()
      await authController.login(req, res)
      const opts = res.cookie.mock.calls[0][2]
      expect(opts.secure).toBe(false)
      expect(opts.maxAge).toBe(7 * 24 * 60 * 60 * 1000)
      expect(opts.httpOnly).toBe(true)
      process.env.NODE_ENV = prev
    })

    it('secure true in production', async () => {
      const prev = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      vi.mocked(authService.login).mockResolvedValueOnce({ accessToken: 'a', refreshToken: 'r' } as any)
      const req: any = { body: {} }
      const res = mockRes()
      await authController.login(req, res)
      expect(res.cookie.mock.calls[0][2].secure).toBe(true)
      process.env.NODE_ENV = prev
    })
  })
})

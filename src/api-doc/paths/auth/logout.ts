import type { Request, Response, NextFunction } from 'express';

export default function (authService: any) {
  const operations = {
    POST
  };

  async function POST(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.cookies?.tokens) {
        return res.status(404).json({ message: 'No cookies, already logged out', data: null });
      }

      await authService.logout(req.cookies as { tokens: { refresh_token: string } });
      res.clearCookie('tokens', { path: '/' });
      res.status(200).json({ message: 'Logout successful', data: null });
    } catch (err) {
      next(err);
    }
  }

  POST.apiDoc = {
    summary: 'Logout user and clear refresh token.',
    operationId: 'authLogout',
    tags: ['Auth'],
    produces: ['application/json'],
    parameters: [],
    responses: {
      200: { description: 'Logout successful.', schema: { $ref: '#/definitions/ApiResponse' } },
      404: { description: 'Already logged out.', schema: { $ref: '#/definitions/Error' } },
      default: { description: 'An error occurred', schema: { $ref: '#/definitions/Error' } }
    }
  };

  return operations;
}

import type { Request, Response, NextFunction } from 'express';

export default function (authService: any) {
  const operations = {
    POST
  };

  async function POST(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.tokens?.refresh_token;
      const result: any = await authService.refresh(refreshToken);

      if (result && result.refreshToken) {
        res.cookie('tokens', { access_token: result.accessToken, refresh_token: result.refreshToken }, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/'
        });
      }

      res.status(200).json({ message: 'Refresh successful', data: result });
    } catch (err) {
      next(err);
    }
  }

  POST.apiDoc = {
    summary: 'Refresh access token using refresh token cookie.',
    operationId: 'authRefresh',
    tags: ['Auth'],
    produces: ['application/json'],
    parameters: [],
    responses: {
      200: {
        description: 'Refresh successful.',
        schema: { $ref: '#/definitions/ApiResponse' }
      },
      400: { description: 'Refresh token is required.', schema: { $ref: '#/definitions/Error' } },
      401: { description: 'Invalid or expired refresh token.', schema: { $ref: '#/definitions/Error' } },
      default: { description: 'An error occurred', schema: { $ref: '#/definitions/Error' } }
    }
  };

  return operations;
}

import type { Request, Response, NextFunction } from 'express';

export default function (authService: any) {
  const operations = {
    POST
  };

  async function POST(req: Request, res: Response, next: NextFunction) {
    try {
      const result: any = await authService.login(req.body);
      if (result instanceof Error) return next(result);

      if (result && result.refreshToken) {
        res.cookie('tokens', { access_token: result.accessToken, refresh_token: result.refreshToken }, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
          path: '/'
        });
      }

      res.status(200).json({ message: 'Login successful', data: result });
    } catch (err) {
      next(err);
    }
  }

  POST.apiDoc = {
    summary: 'Login user.',
    operationId: 'authLogin',
    tags: ['Auth'],
    consumes: ['application/json'],
    produces: ['application/json'],
    parameters: [
      {
        in: 'body',
        name: 'body',
        required: true,
        schema: { $ref: '#/definitions/LoginRequest' }
      }
    ],
    responses: {
      200: {
        description: 'Login successful.',
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/definitions/User' },
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' }
              }
            }
          }
        }
      },
      400: { description: 'Bad Request.', schema: { $ref: '#/definitions/Error' } },
      401: { description: 'Unauthorized - invalid credentials.', schema: { $ref: '#/definitions/Error' } },
      404: { description: 'User not found.', schema: { $ref: '#/definitions/Error' } },
      default: { description: 'An error occurred', schema: { $ref: '#/definitions/Error' } }
    }
  };

  return operations;
}

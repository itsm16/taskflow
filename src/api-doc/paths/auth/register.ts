import type { Request, Response, NextFunction } from 'express';

export default function (authService: any) {
  const operations = {
    POST
  };

  async function POST(req: Request, res: Response, next: NextFunction) {
    try {
      const result: any = await authService.register(req.body);
      if (result instanceof Error) return next(result);
      res.status(200).json({ message: 'Registration successful', data: result });
    } catch (err) {
      next(err);
    }
  }

  POST.apiDoc = {
    summary: 'Register a new user.',
    operationId: 'authRegister',
    tags: ['Auth'],
    consumes: ['application/json'],
    produces: ['application/json'],
    parameters: [
      {
        in: 'body',
        name: 'body',
        required: true,
        schema: { $ref: '#/definitions/RegisterRequest' }
      }
    ],
    responses: {
      200: {
        description: 'Registration successful.',
        schema: { $ref: '#/definitions/ApiResponse' }
      },
      400: {
        description: 'Bad Request - validation error.',
        schema: { $ref: '#/definitions/Error' }
      },
      409: {
        description: 'Conflict - email already exists.',
        schema: { $ref: '#/definitions/Error' }
      },
      default: {
        description: 'An error occurred',
        schema: { $ref: '#/definitions/Error' }
      }
    }
  };

  return operations;
}

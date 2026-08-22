import type { Request, Response, NextFunction } from 'express';

export default function (healthService: { getHealth(): { status: string } }) {
  const operations = {
    GET
  };

  function GET(req: Request, res: Response, next: NextFunction) {
    res.status(200).json(healthService.getHealth());
  }

  GET.apiDoc = {
    summary: 'Returns service health status.',
    operationId: 'getHealth',
    responses: {
      200: {
        description: 'Service is healthy.',
        schema: {
          type: 'object',
          properties: {
            status: { type: 'string' }
          }
        }
      },
      default: {
        description: 'An error occurred',
        schema: {
          additionalProperties: true
        }
      }
    }
  };

  return operations;
}

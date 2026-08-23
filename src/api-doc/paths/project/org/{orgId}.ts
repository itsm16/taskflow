import type { Request, Response, NextFunction } from 'express';

export default function (projectService: any) {
  const operations = { GET };

  async function GET(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = (req as any).params.orgId as string;
      const result = await projectService.getOrgProjects({ orgId });
      res.status(200).json({ message: 'Projects fetched successfully', data: result });
    } catch (err) {
      next(err);
    }
  }

  GET.apiDoc = {
    summary: 'List all projects of an organization.',
    operationId: 'getOrgProjects',
    tags: ['Project'],
    produces: ['application/json'],
    parameters: [
      {
        name: 'orgId',
        in: 'path',
        required: true,
        type: 'string',
        format: 'uuid',
        description: 'Organization ID.'
      }
    ],
    responses: {
      200: {
        description: 'Projects fetched.',
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            data: { type: 'array', items: { $ref: '#/definitions/Project' } }
          }
        }
      },
      400: { description: 'Bad Request.', schema: { $ref: '#/definitions/Error' } },
      401: { description: 'Unauthorized.', schema: { $ref: '#/definitions/Error' } },
      403: { description: 'Forbidden - cross-tenant.', schema: { $ref: '#/definitions/Error' } },
      default: { description: 'An error occurred', schema: { $ref: '#/definitions/Error' } }
    }
  };

  return operations;
}

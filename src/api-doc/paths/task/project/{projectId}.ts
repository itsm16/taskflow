import type { Request, Response, NextFunction } from 'express';

export default function (taskService: any) {
  const operations = { GET };

  async function GET(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = (req as any).params.projectId as string;
      const orgId = req.query.orgId as string;
      const result = await taskService.getProjectTasks({ projectId, orgId });
      res.status(200).json({ message: 'Tasks fetched successfully', data: result });
    } catch (err) {
      next(err);
    }
  }

  GET.apiDoc = {
    summary: 'List tasks of a project. Tenant-scoped via orgId query param.',
    operationId: 'getProjectTasks',
    tags: ['Task'],
    produces: ['application/json'],
    parameters: [
      { name: 'projectId', in: 'path', required: true, type: 'string', format: 'uuid' },
      { name: 'orgId', in: 'query', required: true, type: 'string', format: 'uuid' }
    ],
    responses: {
      200: {
        description: 'Tasks fetched.',
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            data: { type: 'array', items: { $ref: '#/definitions/Task' } }
          }
        }
      },
      400: { description: 'Bad Request.', schema: { $ref: '#/definitions/Error' } },
      401: { description: 'Unauthorized.', schema: { $ref: '#/definitions/Error' } },
      403: { description: 'Forbidden - cross-tenant.', schema: { $ref: '#/definitions/Error' } },
      404: { description: 'Project not found.', schema: { $ref: '#/definitions/Error' } },
      default: { description: 'An error occurred', schema: { $ref: '#/definitions/Error' } }
    }
  };

  return operations;
}

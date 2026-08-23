import type { Request, Response, NextFunction } from 'express';

export default function (taskService: any) {
  const operations = { POST };

  async function POST(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await taskService.createTask({
        name: req.body.name,
        description: req.body.description,
        projectId: req.body.projectId,
        orgId: req.body.orgId
      });
      if (result instanceof Error) return next(result);
      res.status(201).json({ message: 'Task created successfully', data: result });
    } catch (err) {
      next(err);
    }
  }

  POST.apiDoc = {
    summary: 'Create a task under a project. Body projectId orgId validated via project tenant (→ 403 on cross-tenant).',
    operationId: 'createTask',
    tags: ['Task'],
    consumes: ['application/json'],
    produces: ['application/json'],
    parameters: [
      {
        in: 'body',
        name: 'body',
        required: true,
        schema: { $ref: '#/definitions/CreateTaskRequest' }
      }
    ],
    responses: {
      201: { description: 'Task created.', schema: { $ref: '#/definitions/ApiResponse' } },
      400: { description: 'Bad Request.', schema: { $ref: '#/definitions/Error' } },
      401: { description: 'Unauthorized.', schema: { $ref: '#/definitions/Error' } },
      403: { description: 'Forbidden - cross-tenant.', schema: { $ref: '#/definitions/Error' } },
      404: { description: 'Project not found.', schema: { $ref: '#/definitions/Error' } },
      default: { description: 'An error occurred', schema: { $ref: '#/definitions/Error' } }
    }
  };

  return operations;
}

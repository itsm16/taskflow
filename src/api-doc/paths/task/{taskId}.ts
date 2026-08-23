import type { Request, Response, NextFunction } from 'express';

export default function (taskService: any) {
  const operations = { GET, PUT, DELETE };

  async function GET(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = (req as any).params.taskId as string;
      const orgId = req.query.orgId as string;
      const result = await taskService.getTask({ taskId, orgId });
      if (result instanceof Error) return next(result);
      res.status(200).json({ message: 'Task fetched successfully', data: result });
    } catch (err) {
      next(err);
    }
  }

  async function PUT(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = (req as any).params.taskId as string;
      const result = await taskService.updateTask({
        taskId,
        name: req.body.name,
        description: req.body.description,
        status: req.body.status,
        priority: req.body.priority,
        orgId: req.body.orgId
      });
      if (result instanceof Error) return next(result);
      res.status(200).json({ message: 'Task updated successfully', data: result });
    } catch (err) {
      next(err);
    }
  }

  async function DELETE(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = (req as any).params.taskId as string;
      const orgId = req.query.orgId as string;
      const result = await taskService.deleteTask({ taskId, orgId });
      if (result instanceof Error) return next(result);
      res.status(200).json({ message: 'Task deleted successfully', data: result });
    } catch (err) {
      next(err);
    }
  }

  GET.apiDoc = {
    summary: 'Get a single task by ID. Requires orgId query param (assertTenant → 403).',
    operationId: 'getTask',
    tags: ['Task'],
    produces: ['application/json'],
    parameters: [
      { name: 'taskId', in: 'path', required: true, type: 'string', format: 'uuid' },
      { name: 'orgId', in: 'query', required: true, type: 'string', format: 'uuid' }
    ],
    responses: {
      200: { description: 'Task fetched.', schema: { $ref: '#/definitions/ApiResponse' } },
      400: { description: 'Bad Request.', schema: { $ref: '#/definitions/Error' } },
      401: { description: 'Unauthorized.', schema: { $ref: '#/definitions/Error' } },
      403: { description: 'Forbidden - cross-tenant.', schema: { $ref: '#/definitions/Error' } },
      404: { description: 'Task not found.', schema: { $ref: '#/definitions/Error' } },
      default: { description: 'An error occurred', schema: { $ref: '#/definitions/Error' } }
    }
  };

  PUT.apiDoc = {
    summary: 'Update a task. Body orgId required; status/priority validated.',
    operationId: 'updateTask',
    tags: ['Task'],
    consumes: ['application/json'],
    produces: ['application/json'],
    parameters: [
      { name: 'taskId', in: 'path', required: true, type: 'string', format: 'uuid' },
      { in: 'body', name: 'body', required: true, schema: { $ref: '#/definitions/UpdateTaskRequest' } }
    ],
    responses: {
      200: { description: 'Task updated.', schema: { $ref: '#/definitions/ApiResponse' } },
      400: { description: 'Bad Request / nothing to update.', schema: { $ref: '#/definitions/Error' } },
      401: { description: 'Unauthorized.', schema: { $ref: '#/definitions/Error' } },
      403: { description: 'Forbidden - cross-tenant.', schema: { $ref: '#/definitions/Error' } },
      404: { description: 'Task not found.', schema: { $ref: '#/definitions/Error' } },
      default: { description: 'An error occurred', schema: { $ref: '#/definitions/Error' } }
    }
  };

  DELETE.apiDoc = {
    summary: 'Soft-delete a task (sets deleted_at). Requires orgId query param.',
    operationId: 'deleteTask',
    tags: ['Task'],
    produces: ['application/json'],
    parameters: [
      { name: 'taskId', in: 'path', required: true, type: 'string', format: 'uuid' },
      { name: 'orgId', in: 'query', required: true, type: 'string', format: 'uuid' }
    ],
    responses: {
      200: { description: 'Task deleted.', schema: { $ref: '#/definitions/ApiResponse' } },
      400: { description: 'Bad Request.', schema: { $ref: '#/definitions/Error' } },
      401: { description: 'Unauthorized.', schema: { $ref: '#/definitions/Error' } },
      403: { description: 'Forbidden - cross-tenant.', schema: { $ref: '#/definitions/Error' } },
      404: { description: 'Task not found.', schema: { $ref: '#/definitions/Error' } },
      default: { description: 'An error occurred', schema: { $ref: '#/definitions/Error' } }
    }
  };

  return operations;
}

import type { Request, Response, NextFunction } from 'express';

export default function (projectService: any) {
  const operations = { GET, PUT, DELETE };

  async function GET(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = (req as any).params.projId as string;
      const orgId = req.query.orgId as string;
      const result = await projectService.getProject({ projectId, orgId });
      if (result instanceof Error) return next(result);
      res.status(200).json({ message: 'Project fetched successfully', data: result });
    } catch (err) {
      next(err);
    }
  }

  async function PUT(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = (req as any).params.projId as string;
      const result = await projectService.updateProject({ projectId, name: req.body.name, orgId: req.body.orgId });
      if (result instanceof Error) return next(result);
      res.status(200).json({ message: 'Project updated successfully', data: result });
    } catch (err) {
      next(err);
    }
  }

  async function DELETE(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = (req as any).params.projId as string;
      const orgId = req.query.orgId as string;
      const result = await projectService.deleteProject({ projectId, orgId });
      if (result instanceof Error) return next(result);
      res.status(200).json({ message: 'Project deleted successfully', data: result });
    } catch (err) {
      next(err);
    }
  }

  GET.apiDoc = {
    summary: 'Get a single project by ID. Requires orgId query param for tenant isolation (assertTenant → 403 on cross-tenant).',
    operationId: 'getProject',
    tags: ['Project'],
    produces: ['application/json'],
    parameters: [
      { name: 'projId', in: 'path', required: true, type: 'string', format: 'uuid', description: 'Project ID.' },
      { name: 'orgId', in: 'query', required: true, type: 'string', format: 'uuid', description: 'Organization ID (tenant isolation).' }
    ],
    responses: {
      200: { description: 'Project fetched.', schema: { $ref: '#/definitions/ApiResponse' } },
      400: { description: 'Bad Request.', schema: { $ref: '#/definitions/Error' } },
      401: { description: 'Unauthorized.', schema: { $ref: '#/definitions/Error' } },
      403: { description: 'Forbidden - cross-tenant.', schema: { $ref: '#/definitions/Error' } },
      404: { description: 'Project not found.', schema: { $ref: '#/definitions/Error' } },
      default: { description: 'An error occurred', schema: { $ref: '#/definitions/Error' } }
    }
  };

  PUT.apiDoc = {
    summary: 'Update a project name. Cross-tenant guarded (body orgId vs row organization_id).',
    operationId: 'updateProject',
    tags: ['Project'],
    consumes: ['application/json'],
    produces: ['application/json'],
    parameters: [
      { name: 'projId', in: 'path', required: true, type: 'string', format: 'uuid' },
      { in: 'body', name: 'body', required: true, schema: { $ref: '#/definitions/UpdateProjectRequest' } }
    ],
    responses: {
      200: { description: 'Project updated.', schema: { $ref: '#/definitions/ApiResponse' } },
      400: { description: 'Bad Request / nothing to update.', schema: { $ref: '#/definitions/Error' } },
      401: { description: 'Unauthorized.', schema: { $ref: '#/definitions/Error' } },
      403: { description: 'Forbidden - cross-tenant.', schema: { $ref: '#/definitions/Error' } },
      404: { description: 'Project not found.', schema: { $ref: '#/definitions/Error' } },
      default: { description: 'An error occurred', schema: { $ref: '#/definitions/Error' } }
    }
  };

  DELETE.apiDoc = {
    summary: 'Soft-delete a project (sets deleted_at). Requires orgId query param.',
    operationId: 'deleteProject',
    tags: ['Project'],
    produces: ['application/json'],
    parameters: [
      { name: 'projId', in: 'path', required: true, type: 'string', format: 'uuid' },
      { name: 'orgId', in: 'query', required: true, type: 'string', format: 'uuid' }
    ],
    responses: {
      200: { description: 'Project deleted.', schema: { $ref: '#/definitions/ApiResponse' } },
      400: { description: 'Bad Request.', schema: { $ref: '#/definitions/Error' } },
      401: { description: 'Unauthorized.', schema: { $ref: '#/definitions/Error' } },
      403: { description: 'Forbidden - cross-tenant.', schema: { $ref: '#/definitions/Error' } },
      404: { description: 'Project not found.', schema: { $ref: '#/definitions/Error' } },
      default: { description: 'An error occurred', schema: { $ref: '#/definitions/Error' } }
    }
  };

  return operations;
}

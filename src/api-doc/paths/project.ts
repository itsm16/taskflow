import type { Request, Response, NextFunction } from 'express';

export default function (projectService: any) {
  const operations = { POST };

  async function POST(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await projectService.createProject({ name: req.body.name, orgId: req.body.orgId });
      if (result instanceof Error) return next(result);
      res.status(201).json({ message: 'Project created successfully', data: result });
    } catch (err) {
      next(err);
    }
  }

  POST.apiDoc = {
    summary: 'Create a project. Requires org membership via checkOrg.',
    operationId: 'createProject',
    tags: ['Project'],
    consumes: ['application/json'],
    produces: ['application/json'],
    parameters: [
      {
        in: 'body',
        name: 'body',
        required: true,
        schema: { $ref: '#/definitions/CreateProjectRequest' }
      }
    ],
    responses: {
      201: { description: 'Project created.', schema: { $ref: '#/definitions/ApiResponse' } },
      400: { description: 'Bad Request.', schema: { $ref: '#/definitions/Error' } },
      401: { description: 'Unauthorized.', schema: { $ref: '#/definitions/Error' } },
      403: { description: 'Forbidden - not org member.', schema: { $ref: '#/definitions/Error' } },
      default: { description: 'An error occurred', schema: { $ref: '#/definitions/Error' } }
    }
  };

  return operations;
}

import type { Request, Response, NextFunction } from 'express';

export default function (authService: any) {
  const operations = {
    GET,
    POST,
    PUT,
    DELETE
  };

  // GET /api/auth/members/{id}  -> id is orgId
  async function GET(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = (req as any).params.id as string;
      const members = await authService.getMembers({ orgId });
      res.status(200).json({ message: 'Members fetched successfully', data: members });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/auth/members/{id} -> id is userId, body { orgId }
  async function POST(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).params.id as string;
      const member = await authService.addMember({ userId, orgId: req.body.orgId });
      res.status(200).json({ message: 'Member added successfully', data: member });
    } catch (err) {
      next(err);
    }
  }

  // PUT /api/auth/members/{id} -> id is userId, body { orgId }
  async function PUT(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).params.id as string;
      const member = await authService.updateMember({ userId, orgId: req.body.orgId });
      res.status(200).json({ message: 'Member updated successfully', data: member });
    } catch (err) {
      next(err);
    }
  }

  // DELETE /api/auth/members/{id}?orgId=xxx -> id is userId
  async function DELETE(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).params.id as string;
      const orgId = req.query.orgId as string;
      const member = await authService.removeMember({ userId, orgId });
      res.status(200).json({ message: 'Member removed successfully', data: member });
    } catch (err) {
      next(err);
    }
  }

  GET.apiDoc = {
    summary: 'List all members of an organization.',
    operationId: 'getMembers',
    tags: ['Auth - Members'],
    produces: ['application/json'],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        type: 'string',
        format: 'uuid',
        description: 'Organization ID (mapped to :orgId in router).'
      }
    ],
    responses: {
      200: {
        description: 'Members fetched successfully.',
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            data: { type: 'array', items: { $ref: '#/definitions/Member' } }
          }
        }
      },
      400: { description: 'Organization ID is required.', schema: { $ref: '#/definitions/Error' } },
      401: { description: 'Unauthorized.', schema: { $ref: '#/definitions/Error' } },
      403: { description: 'Forbidden - insufficient permissions / not org member.', schema: { $ref: '#/definitions/Error' } },
      default: { description: 'An error occurred', schema: { $ref: '#/definitions/Error' } }
    }
  };

  POST.apiDoc = {
    summary: 'Add a user as member of an organization. Requires org_admin + org membership. Sends email notification.',
    operationId: 'addMember',
    tags: ['Auth - Members'],
    consumes: ['application/json'],
    produces: ['application/json'],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        type: 'string',
        format: 'uuid',
        description: 'User ID to add (mapped to :userId).'
      },
      {
        in: 'body',
        name: 'body',
        required: true,
        schema: { $ref: '#/definitions/MemberRequest' }
      }
    ],
    responses: {
      200: { description: 'Member added successfully.', schema: { $ref: '#/definitions/ApiResponse' } },
      400: { description: 'Bad Request.', schema: { $ref: '#/definitions/Error' } },
      401: { description: 'Unauthorized.', schema: { $ref: '#/definitions/Error' } },
      403: { description: 'Forbidden.', schema: { $ref: '#/definitions/Error' } },
      404: { description: 'User not found.', schema: { $ref: '#/definitions/Error' } },
      409: { description: 'Already a member.', schema: { $ref: '#/definitions/Error' } },
      default: { description: 'An error occurred', schema: { $ref: '#/definitions/Error' } }
    }
  };

  PUT.apiDoc = {
    summary: 'Update member organization assignment.',
    operationId: 'updateMember',
    tags: ['Auth - Members'],
    consumes: ['application/json'],
    produces: ['application/json'],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        type: 'string',
        format: 'uuid',
        description: 'User ID whose membership to update.'
      },
      {
        in: 'body',
        name: 'body',
        required: true,
        schema: { $ref: '#/definitions/UpdateMemberRequest' }
      }
    ],
    responses: {
      200: { description: 'Member updated successfully.', schema: { $ref: '#/definitions/ApiResponse' } },
      400: { description: 'Bad Request.', schema: { $ref: '#/definitions/Error' } },
      401: { description: 'Unauthorized.', schema: { $ref: '#/definitions/Error' } },
      403: { description: 'Forbidden.', schema: { $ref: '#/definitions/Error' } },
      404: { description: 'Member not found.', schema: { $ref: '#/definitions/Error' } },
      default: { description: 'An error occurred', schema: { $ref: '#/definitions/Error' } }
    }
  };

  DELETE.apiDoc = {
    summary: 'Remove a user from an organization.',
    operationId: 'removeMember',
    tags: ['Auth - Members'],
    produces: ['application/json'],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        type: 'string',
        format: 'uuid',
        description: 'User ID to remove.'
      },
      {
        name: 'orgId',
        in: 'query',
        required: true,
        type: 'string',
        format: 'uuid',
        description: 'Organization ID to remove from (query param).'
      }
    ],
    responses: {
      200: { description: 'Member removed successfully.', schema: { $ref: '#/definitions/ApiResponse' } },
      400: { description: 'Bad Request.', schema: { $ref: '#/definitions/Error' } },
      401: { description: 'Unauthorized.', schema: { $ref: '#/definitions/Error' } },
      403: { description: 'Forbidden.', schema: { $ref: '#/definitions/Error' } },
      404: { description: 'Member not found.', schema: { $ref: '#/definitions/Error' } },
      default: { description: 'An error occurred', schema: { $ref: '#/definitions/Error' } }
    }
  };

  return operations;
}

const apiDoc = {
  swagger: '2.0',
  basePath: '/api',
  info: {
    title: 'Taskflow API',
    version: '1.0.0',
    description: 'Taskflow - multi-tenant project & task management API'
  },
  definitions: {
    RegisterRequest: {
      type: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: { type: 'string', example: 'Alice Admin' },
        email: { type: 'string', format: 'email', example: 'alice@taskflow.dev' },
        password: { type: 'string', format: 'password', minLength: 6, example: 'password123' }
      }
    },
    LoginRequest: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'alice@taskflow.dev' },
        password: { type: 'string', format: 'password', example: 'password123' }
      }
    },
    MemberRequest: {
      type: 'object',
      required: ['orgId'],
      properties: {
        orgId: { type: 'string', format: 'uuid', example: 'a6a56fdf-a32e-44e3-8a54-5083006b0b39' }
      }
    },
    UpdateMemberRequest: {
      type: 'object',
      required: ['orgId'],
      properties: {
        orgId: { type: 'string', format: 'uuid', example: '9578009a-c639-4af0-8b6f-00c6211fb3d0' }
      }
    },
    User: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string', enum: ['member', 'org_admin'] },
        access_token: { type: 'string' },
        refresh_token: { type: 'string' }
      }
    },
    Member: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        user_id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string', enum: ['member', 'org_admin'] },
        assigned_organization: { type: 'string', format: 'uuid' }
      }
    },
    ApiResponse: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: { type: 'object', additionalProperties: true }
      }
    },
    CreateProjectRequest: {
      type: 'object',
      required: ['name', 'orgId'],
      properties: {
        name: { type: 'string', example: 'Website Redesign' },
        orgId: { type: 'string', format: 'uuid' }
      }
    },
    UpdateProjectRequest: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Website v2' },
        orgId: { type: 'string', format: 'uuid', description: 'Organization ID — must match project tenant (cross-tenant → 403)' }
      }
    },
    Project: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        organization_id: { type: 'string', format: 'uuid' },
        deleted_at: { type: 'string', format: 'date-time' }
      }
    },
    CreateTaskRequest: {
      type: 'object',
      required: ['name', 'projectId', 'orgId'],
      properties: {
        name: { type: 'string', example: 'Design new homepage' },
        description: { type: 'string', example: 'Figma mockups for landing page' },
        projectId: { type: 'string', format: 'uuid' },
        orgId: { type: 'string', format: 'uuid' }
      }
    },
    UpdateTaskRequest: {
      type: 'object',
      required: ['orgId'],
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done'] },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        orgId: { type: 'string', format: 'uuid' }
      }
    },
    Task: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        description: { type: 'string' },
        project_id: { type: 'string', format: 'uuid' },
        organization_id: { type: 'string', format: 'uuid' },
        status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done'] },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        deleted_at: { type: 'string', format: 'date-time' }
      }
    },
    Error: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Insufficient permissions' }
      }
    }
  },
  paths: {}
};

export default apiDoc;

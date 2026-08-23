import { db } from "../../common/db/index.js"
import ApiError from "../../common/utils/api-error.js"
import { assertTenant } from "../../common/utils/assert-tenant.js"
import { projectTable } from "../project/project.schema.js"
import { tasksTable } from "./task.schema.js"
import { and, eq, isNull } from "drizzle-orm"
import type { CreateTaskDtoType, UpdateTaskInput, GetTaskDtoType, GetProjectTasksDtoType, DeleteTaskDtoType } from "./dto/task.dto.js"

const TASK_STATUSES = ["todo", "in_progress", "review", "done"] as const
const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const

type TaskStatus = (typeof TASK_STATUSES)[number]
type TaskPriority = (typeof TASK_PRIORITIES)[number]

const createTask = async ({name, description, projectId, orgId}: CreateTaskDtoType) => {
    if(!name || !projectId || !orgId) {
        throw ApiError.badRequest("Name, project ID and organization ID are required")
    }

    const [project] = await db
    .select({organization_id: projectTable.organization_id})
    .from(projectTable)
    .where(and(
        eq(projectTable.id, projectId),
        isNull(projectTable.deleted_at)
    ))
    .limit(1)

    if(!project) {
        throw ApiError.notFound("Project not found")
    }

    assertTenant({resourceOrganizationId: project.organization_id, orgId})

    const [task] = await db.insert(tasksTable).values({
        name,
        description,
        project_id: projectId,
        organization_id: orgId
    }).returning()

    if(!task) {
        throw ApiError.internal("Failed to create task")
    }

    return task
}

const getTask = async ({taskId, orgId}: GetTaskDtoType) => {
    if(!taskId || !orgId) {
        throw ApiError.badRequest("Task ID and organization ID are required")
    }

    const [task] = await db
    .select()
    .from(tasksTable)
    .where(and(
        eq(tasksTable.id, taskId),
        isNull(tasksTable.deleted_at)
    ))
    .limit(1)

    if(!task) {
        throw ApiError.notFound("Task not found")
    }

    assertTenant({resourceOrganizationId: task.organization_id, orgId})

    return task
}

const getProjectTasks = async ({projectId, orgId}: GetProjectTasksDtoType) => {
    if(!projectId || !orgId) {
        throw ApiError.badRequest("Project ID and organization ID are required")
    }

    const [project] = await db
    .select({organization_id: projectTable.organization_id})
    .from(projectTable)
    .where(and(
        eq(projectTable.id, projectId),
        isNull(projectTable.deleted_at)
    ))
    .limit(1)

    if(!project) {
        throw ApiError.notFound("Project not found")
    }

    assertTenant({resourceOrganizationId: project.organization_id, orgId})

    const tasks = await db
    .select()
    .from(tasksTable)
    .where(and(
        eq(tasksTable.project_id, projectId),
        isNull(tasksTable.deleted_at)
    ))

    return tasks
}

const updateTask = async ({taskId, name, description, status, priority, orgId}: UpdateTaskInput) => {
    if(!taskId || !orgId) {
        throw ApiError.badRequest("Task ID and organization ID are required")
    }

    const [existing] = await db
    .select({organization_id: tasksTable.organization_id})
    .from(tasksTable)
    .where(and(
        eq(tasksTable.id, taskId),
        isNull(tasksTable.deleted_at)
    ))
    .limit(1)

    if(!existing) {
        throw ApiError.notFound("Task not found")
    }

    assertTenant({resourceOrganizationId: existing.organization_id, orgId})

    const updates: Partial<{name: string, description: string, status: TaskStatus, priority: TaskPriority}> = {}

    if(name) {
        updates.name = name
    }

    if(description) {
        updates.description = description
    }

    if(status) {
        if(!(TASK_STATUSES as readonly string[]).includes(status)) {
            throw ApiError.badRequest(`Status must be one of: ${TASK_STATUSES.join(", ")}`)
        }
        updates.status = status as TaskStatus
    }

    if(priority) {
        if(!(TASK_PRIORITIES as readonly string[]).includes(priority)) {
            throw ApiError.badRequest(`Priority must be one of: ${TASK_PRIORITIES.join(", ")}`)
        }
        updates.priority = priority as TaskPriority
    }

    if(Object.keys(updates).length === 0) {
        throw ApiError.badRequest("Nothing to update")
    }

    const [task] = await db
    .update(tasksTable)
    .set(updates)
    .where(and(
        eq(tasksTable.id, taskId),
        isNull(tasksTable.deleted_at)
    ))
    .returning()

    if(!task) {
        throw ApiError.notFound("Task not found")
    }

    return task
}

const deleteTask = async ({taskId, orgId}: DeleteTaskDtoType) => {
    if(!taskId || !orgId) {
        throw ApiError.badRequest("Task ID and organization ID are required")
    }

    const [existing] = await db
    .select({organization_id: tasksTable.organization_id})
    .from(tasksTable)
    .where(and(
        eq(tasksTable.id, taskId),
        isNull(tasksTable.deleted_at)
    ))
    .limit(1)

    if(!existing) {
        throw ApiError.notFound("Task not found")
    }

    assertTenant({resourceOrganizationId: existing.organization_id, orgId})

    const [task] = await db
    .update(tasksTable)
    .set({deleted_at: new Date()})
    .where(and(
        eq(tasksTable.id, taskId),
        isNull(tasksTable.deleted_at)
    ))
    .returning()

    if(!task) {
        throw ApiError.notFound("Task not found")
    }

    return task
}

export {
    createTask,
    getTask,
    getProjectTasks,
    updateTask,
    deleteTask
}

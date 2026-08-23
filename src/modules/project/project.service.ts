import { db } from "../../common/db/index.js"
import ApiError from "../../common/utils/api-error.js"
import { assertTenant } from "../../common/utils/assert-tenant.js"
import { projectTable } from "./project.schema.js"
import { and, eq, isNull } from "drizzle-orm"
import type { CreateProjectDtoType, UpdateProjectInput, GetProjectDtoType, GetOrgProjectsDtoType, DeleteProjectDtoType } from "./dto/project.dto.js"

const createProject = async ({name, orgId}: CreateProjectDtoType) => {
    if(!name || !orgId) {
        throw ApiError.badRequest("Name and organization ID are required")
    }

    const [project] = await db.insert(projectTable).values({
        name,
        organization_id: orgId
    }).returning()

    if(!project) {
        throw ApiError.internal("Failed to create project")
    }

    return project
}

const getProject = async ({projectId, orgId}: GetProjectDtoType) => {
    if(!projectId || !orgId) {
        throw ApiError.badRequest("Project ID and organization ID are required")
    }

    const [project] = await db
    .select()
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

    return project
}

const getOrgProjects = async ({orgId}: GetOrgProjectsDtoType) => {
    if(!orgId) {
        throw ApiError.badRequest("Organization ID is required")
    }

    const projects = await db
    .select()
    .from(projectTable)
    .where(and(
        eq(projectTable.organization_id, orgId),
        isNull(projectTable.deleted_at)
    ))

    return projects
}

const updateProject = async ({projectId, name, orgId}: UpdateProjectInput) => {
    if(!projectId || !orgId) {
        throw ApiError.badRequest("Project ID and organization ID are required")
    }

    const [existing] = await db
    .select({organization_id: projectTable.organization_id})
    .from(projectTable)
    .where(and(
        eq(projectTable.id, projectId),
        isNull(projectTable.deleted_at)
    ))
    .limit(1)

    if(!existing) {
        throw ApiError.notFound("Project not found")
    }

    assertTenant({resourceOrganizationId: existing.organization_id, orgId})

    const updates: Partial<{name: string}> = {}

    if(name) {
        updates.name = name
    }

    if(Object.keys(updates).length === 0) {
        throw ApiError.badRequest("Nothing to update")
    }

    const [project] = await db
    .update(projectTable)
    .set(updates)
    .where(and(
        eq(projectTable.id, projectId),
        isNull(projectTable.deleted_at)
    ))
    .returning()

    if(!project) {
        throw ApiError.notFound("Project not found")
    }

    return project
}

const deleteProject = async ({projectId, orgId}: DeleteProjectDtoType) => {
    if(!projectId || !orgId) {
        throw ApiError.badRequest("Project ID and organization ID are required")
    }

    const [existing] = await db
    .select({organization_id: projectTable.organization_id})
    .from(projectTable)
    .where(and(
        eq(projectTable.id, projectId),
        isNull(projectTable.deleted_at)
    ))
    .limit(1)

    if(!existing) {
        throw ApiError.notFound("Project not found")
    }

    assertTenant({resourceOrganizationId: existing.organization_id, orgId})

    const [project] = await db
    .update(projectTable)
    .set({deleted_at: new Date()})
    .where(and(
        eq(projectTable.id, projectId),
        isNull(projectTable.deleted_at)
    ))
    .returning()

    if(!project) {
        throw ApiError.notFound("Project not found")
    }

    return project
}

export {
    createProject,
    getProject,
    getOrgProjects,
    updateProject,
    deleteProject
}

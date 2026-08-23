import ApiResponse from "../../common/utils/api-response.js"
import * as projectService from './project.service.js'
import type { Response, Request } from "express"

const createProject = async (req: Request, res: Response) => {
    const project = await projectService.createProject({
        name: req.body.name,
        orgId: req.body.orgId
    })
    return ApiResponse.created(res, "Project created successfully", project)
}

const getProject = async (req: Request, res: Response) => {
    const project = await projectService.getProject({
        projectId: req.params.projId as string,
        orgId: req.query.orgId as string
    })
    return ApiResponse.ok(res, "Project fetched successfully", project)
}

const getOrgProjects = async (req: Request, res: Response) => {
    const projects = await projectService.getOrgProjects({orgId: req.params.orgId as string})
    return ApiResponse.ok(res, "Projects fetched successfully", projects)
}

const updateProject = async (req: Request, res: Response) => {
    const project = await projectService.updateProject({
        projectId: req.params.projId as string,
        name: req.body.name,
        orgId: req.body.orgId
    })
    return ApiResponse.ok(res, "Project updated successfully", project)
}

const deleteProject = async (req: Request, res: Response) => {
    const project = await projectService.deleteProject({
        projectId: req.params.projId as string,
        orgId: req.query.orgId as string
    })
    return ApiResponse.ok(res, "Project deleted successfully", project)
}

export {
    createProject,
    getProject,
    getOrgProjects,
    updateProject,
    deleteProject
}

import ApiResponse from "../../common/utils/api-response.js"
import * as taskService from './task.service.js'
import type { Response, Request } from "express"

const createTask = async (req: Request, res: Response) => {
    const task = await taskService.createTask({
        name: req.body.name,
        description: req.body.description,
        projectId: req.body.projectId,
        orgId: req.body.orgId
    })
    return ApiResponse.created(res, "Task created successfully", task)
}

const getTask = async (req: Request, res: Response) => {
    const task = await taskService.getTask({
        taskId: req.params.taskId as string,
        orgId: req.query.orgId as string
    })
    return ApiResponse.ok(res, "Task fetched successfully", task)
}

const getProjectTasks = async (req: Request, res: Response) => {
    const tasks = await taskService.getProjectTasks({
        projectId: req.params.projectId as string,
        orgId: req.query.orgId as string
    })
    return ApiResponse.ok(res, "Tasks fetched successfully", tasks)
}

const updateTask = async (req: Request, res: Response) => {
    const task = await taskService.updateTask({
        taskId: req.params.taskId as string,
        name: req.body.name,
        description: req.body.description,
        status: req.body.status,
        priority: req.body.priority,
        orgId: req.body.orgId
    })
    return ApiResponse.ok(res, "Task updated successfully", task)
}

const deleteTask = async (req: Request, res: Response) => {
    const task = await taskService.deleteTask({
        taskId: req.params.taskId as string,
        orgId: req.query.orgId as string
    })
    return ApiResponse.ok(res, "Task deleted successfully", task)
}

export {
    createTask,
    getTask,
    getProjectTasks,
    updateTask,
    deleteTask
}

import z from "zod";
import { BaseDto } from "../../../common/dto/base.dto.js";

const taskStatusEnum = z.enum(["todo", "in_progress", "review", "done"]);
const taskPriorityEnum = z.enum(["low", "medium", "high", "urgent"]);

class CreateTaskDto extends BaseDto {
    static schema = z.object({
        name: z.string({ error: "Name is required" }).trim().min(1, "Name cannot be empty"),
        description: z.string().trim().optional(),
        projectId: z.string({ error: "Project ID is required" }).trim().uuid({ message: "projectId must be a valid UUID" }),
        orgId: z.string({ error: "Organization ID is required" }).trim().uuid({ message: "orgId must be a valid UUID" }),
    })
}

class UpdateTaskDto extends BaseDto {
    static schema = z.object({
        name: z.string({ error: "Name is required" }).trim().min(1, "Name cannot be empty").optional(),
        description: z.string().trim().optional(),
        status: taskStatusEnum.optional(),
        priority: taskPriorityEnum.optional(),
        orgId: z.string({ error: "Organization ID is required" }).trim().uuid({ message: "orgId must be a valid UUID" }),
    })
}

class GetTaskDto extends BaseDto {
    static schema = z.object({
        taskId: z.string({ error: "Task ID is required" }).trim().uuid({ message: "taskId must be a valid UUID" }),
        orgId: z.string({ error: "Organization ID is required" }).trim().uuid({ message: "orgId must be a valid UUID" }),
    })
}

class GetProjectTasksDto extends BaseDto {
    static schema = z.object({
        projectId: z.string({ error: "Project ID is required" }).trim().uuid({ message: "projectId must be a valid UUID" }),
        orgId: z.string({ error: "Organization ID is required" }).trim().uuid({ message: "orgId must be a valid UUID" }),
    })
}

class DeleteTaskDto extends BaseDto {
    static schema = z.object({
        taskId: z.string({ error: "Task ID is required" }).trim().uuid({ message: "taskId must be a valid UUID" }),
        orgId: z.string({ error: "Organization ID is required" }).trim().uuid({ message: "orgId must be a valid UUID" }),
    })
}

type CreateTaskDtoType = z.infer<typeof CreateTaskDto.schema>
type UpdateTaskDtoType = z.infer<typeof UpdateTaskDto.schema>
type GetTaskDtoType = z.infer<typeof GetTaskDto.schema>
type GetProjectTasksDtoType = z.infer<typeof GetProjectTasksDto.schema>
type DeleteTaskDtoType = z.infer<typeof DeleteTaskDto.schema>

type UpdateTaskInput = UpdateTaskDtoType & { taskId: string }
type CreateTaskInput = CreateTaskDtoType
type GetTaskInput = GetTaskDtoType
type GetProjectTasksInput = GetProjectTasksDtoType
type DeleteTaskInput = DeleteTaskDtoType

export {
    CreateTaskDto,
    UpdateTaskDto,
    GetTaskDto,
    GetProjectTasksDto,
    DeleteTaskDto,
    taskStatusEnum,
    taskPriorityEnum,
}

export type {
    CreateTaskDtoType,
    UpdateTaskDtoType,
    GetTaskDtoType,
    GetProjectTasksDtoType,
    DeleteTaskDtoType,
    CreateTaskInput,
    UpdateTaskInput,
    GetTaskInput,
    GetProjectTasksInput,
    DeleteTaskInput,
}

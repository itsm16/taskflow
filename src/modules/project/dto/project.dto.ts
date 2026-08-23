import z from "zod";
import { BaseDto } from "../../../common/dto/base.dto.js";

class CreateProjectDto extends BaseDto {
    static schema = z.object({
        name: z.string({ error: "Name is required" }).trim().min(1, "Name cannot be empty"),
        orgId: z.string({ error: "Organization ID is required" }).trim().uuid({ message: "orgId must be a valid UUID" }),
    })
}

class UpdateProjectDto extends BaseDto {
    static schema = z.object({
        name: z.string({ error: "Name is required" }).trim().min(1, "Name cannot be empty").optional(),
        orgId: z.string({ error: "Organization ID is required" }).trim().uuid({ message: "orgId must be a valid UUID" }),
    })
}

class GetProjectDto extends BaseDto {
    static schema = z.object({
        projectId: z.string({ error: "Project ID is required" }).trim().uuid({ message: "projectId must be a valid UUID" }),
        orgId: z.string({ error: "Organization ID is required" }).trim().uuid({ message: "orgId must be a valid UUID" }),
    })
}

class GetOrgProjectsDto extends BaseDto {
    static schema = z.object({
        orgId: z.string({ error: "Organization ID is required" }).trim().uuid({ message: "orgId must be a valid UUID" }),
    })
}

class DeleteProjectDto extends BaseDto {
    static schema = z.object({
        projectId: z.string({ error: "Project ID is required" }).trim().uuid({ message: "projectId must be a valid UUID" }),
        orgId: z.string({ error: "Organization ID is required" }).trim().uuid({ message: "orgId must be a valid UUID" }),
    })
}

type CreateProjectDtoType = z.infer<typeof CreateProjectDto.schema>
type UpdateProjectDtoType = z.infer<typeof UpdateProjectDto.schema>
type GetProjectDtoType = z.infer<typeof GetProjectDto.schema>
type GetOrgProjectsDtoType = z.infer<typeof GetOrgProjectsDto.schema>
type DeleteProjectDtoType = z.infer<typeof DeleteProjectDto.schema>

type UpdateProjectInput = UpdateProjectDtoType & { projectId: string }
type GetProjectInput = GetProjectDtoType
type DeleteProjectInput = DeleteProjectDtoType

export {
    CreateProjectDto,
    UpdateProjectDto,
    GetProjectDto,
    GetOrgProjectsDto,
    DeleteProjectDto,
}

export type {
    CreateProjectDtoType,
    UpdateProjectDtoType,
    GetProjectDtoType,
    GetOrgProjectsDtoType,
    DeleteProjectDtoType,
    UpdateProjectInput,
    GetProjectInput,
    DeleteProjectInput,
}

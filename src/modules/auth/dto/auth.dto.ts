import z from "zod";
import { BaseDto } from "../../../common/dto/base.dto.js";

class RegisterDto extends BaseDto {
    static schema = z.object({
        name: z.string({ error: "Name is required" }).trim().min(1, "Name cannot be empty"),
        email: z.email({ error: "Email is required" }).trim(),
        password: z.string({ error: "Password is required" }).min(6, "Password must be at least 6 characters").trim(),
    })
}

class LoginDto extends BaseDto {
    static schema = z.object({
        email: z.email({ error: "Email is required" }).trim(),
        password: z.string({ error: "Password is required" }).min(6, "Password must be at least 6 characters").trim()
    })
}

class AddMemberDto extends BaseDto {
    static schema = z.object({
        orgId: z.string({ error: "Organization ID is required" }).trim().uuid({ message: "orgId must be a valid UUID" }),
    })
}

class UpdateMemberDto extends BaseDto {
    static schema = z.object({
        orgId: z.string({ error: "Organization ID is required" }).trim().uuid({ message: "orgId must be a valid UUID" }),
    })
}

class GetMembersDto extends BaseDto {
    static schema = z.object({
        orgId: z.string({ error: "Organization ID is required" }).trim().uuid({ message: "orgId must be a valid UUID" }),
    })
}

class RemoveMemberDto extends BaseDto {
    static schema = z.object({
        orgId: z.string({ error: "Organization ID is required" }).trim().uuid({ message: "orgId must be a valid UUID" }),
    })
}

type RegisterDtoType = z.infer<typeof RegisterDto.schema>
type LoginDtoType = z.infer<typeof LoginDto.schema>
type AddMemberDtoType = z.infer<typeof AddMemberDto.schema>
type UpdateMemberDtoType = z.infer<typeof UpdateMemberDto.schema>
type GetMembersDtoType = z.infer<typeof GetMembersDto.schema>
type RemoveMemberDtoType = z.infer<typeof RemoveMemberDto.schema>

type AddMemberInput = AddMemberDtoType & { userId: string }
type UpdateMemberInput = UpdateMemberDtoType & { userId: string }
type RemoveMemberInput = RemoveMemberDtoType & { userId: string }

type User = {
    id: string
    name: string
    email: string
    org_id?: string | null
    role: string | null
}

type Token = {
    id: string,
    email: string,
    org_id: string | null
}

export {
    RegisterDto,
    LoginDto,
    AddMemberDto,
    UpdateMemberDto,
    GetMembersDto,
    RemoveMemberDto,
}

export type {
    RegisterDtoType,
    LoginDtoType,
    AddMemberDtoType,
    UpdateMemberDtoType,
    GetMembersDtoType,
    RemoveMemberDtoType,
    AddMemberInput,
    UpdateMemberInput,
    RemoveMemberInput,
    User,
    Token,
}

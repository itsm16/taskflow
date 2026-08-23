import z from "zod";
import { BaseDto } from "../../../common/dto/base.dto.js";

class RegisterDto extends BaseDto{
    static schema = z.object({
        name: z.string({error: "Name is required"}).trim(),
        email: z.email({error: "Email is required"}).trim(),
        password: z.string({error: "Password is required"}).min(6).trim(),
    })
}

class LoginDto extends BaseDto {
    static schema = z.object({
        email: z.email({error: "Email is required"}).trim(),
        password: z.string({error: "Password is required"}).min(6).trim()
    })
}

// types
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

type RegisterDtoType = z.infer<typeof RegisterDto.schema>
type LoginDtoType = z.infer<typeof LoginDto.schema>

export {
    RegisterDto,
    LoginDto,
}

export type {
    User,
    Token,
    RegisterDtoType,
    LoginDtoType
}
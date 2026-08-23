import type { Request } from 'express'
import { db } from "../../common/db/index.js"
import ApiError from "../../common/utils/api-error.js"
import { verifyToken } from "./auth.middleware.js"
import { orgMembersTable, usersTable } from "./auth.schema.js"
import type { RegisterDtoType, Token, User } from "./dto/auth.dto.js"
import bcrypt from "bcrypt"
import { and, eq } from "drizzle-orm"
import JWT from "jsonwebtoken"
import ApiResponse from '../../common/utils/api-response.js'
import { sendMail } from "../../common/utils/api-email.js"

const generateHash = async (password: string) => await bcrypt.hash(password, Number(process.env.SALT))

const comparePassword = async ({password, hashedPassword}: {password: string, hashedPassword: string}) => await bcrypt.compare(password, hashedPassword)

const generateAccessToken = async (data: any) => JWT.sign(data, process.env.JWT_SECRET!, { expiresIn: '15m' })

const generateRefreshToken = async (data: any) => JWT.sign(data, process.env.JWT_SECRET!, {expiresIn: "7d"})


const register = async ({email, name, password}: RegisterDtoType) => {
    if(!email || !name || !password) {
        return ApiError.badRequest("Email, name and password are required")
    }

    const hashedPassword = await generateHash(password)

    if(!hashedPassword) {
        return ApiError.internal("Failed to hash password")
    }

    const [user] = await db.insert(usersTable).values({
        name,
        email,
        password: hashedPassword
    }).returning()

    if(!user) {
        return ApiError.internal("Failed to create user")
    }

    return {
        id: user.id,
        email: user.email,
        name: user.name,
        access_token: null,
        refresh_token: null,
        role: user.role
    };
}

const login = async ({email, password}: {email: string, password: string}) => {
    if(!email || !password) {
        return ApiError.badRequest("Email and password are required")
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email))

    if(!user) {
        return ApiError.notFound("User not found")
    }

    const isPasswordValid = await comparePassword({password, hashedPassword: user.password})

    if(!isPasswordValid) {
        return ApiError.unauthorized("Invalid password")
    }

    const [orgMember] = await db.select().from(orgMembersTable).where(eq(orgMembersTable.user_id, user.id)).limit(1)

    const accessToken = await generateAccessToken({id: user.id, email: user.email, org_id: orgMember?.assigned_organization})
    const refreshToken = await generateRefreshToken({id: user.id, email: user.email, org_id: orgMember?.assigned_organization})

    if(!accessToken || !refreshToken) {
        return ApiError.internal("Failed to generate tokens")
    }

    const [update] = await db
    .update(usersTable)
    .set({
        refresh_token: refreshToken,
        // access_token_expiry: new Date(Date.now() + 15 * 60 * 1000),
        refresh_token_expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })
    .where(eq(usersTable.id, user.id))
    .returning()

    if(!update) {
        return ApiError.internal("Failed to update user")
    }

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            refresh_token_expiry: update.refresh_token_expiry
        },
        accessToken,
        refreshToken
    };
}

const refresh = async (refreshToken: string) => {
    if(!refreshToken) {
        throw ApiError.badRequest("Refresh token is required")
    }

    let decoded: Token
    try {
        decoded = verifyToken(refreshToken) as Token
    } catch {
        throw ApiError.unauthorized("Invalid or expired refresh token")
    }

    if(!decoded.id) {
        throw ApiError.unauthorized("Invalid refresh token")
    }

    const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, decoded.id))
    .limit(1)

    if(!user) {
        throw ApiError.unauthorized("User not found")
    }

    if(user.refresh_token !== refreshToken) {
        throw ApiError.unauthorized("Invalid refresh token")
    }

    const [orgMember] = await db
    .select()
    .from(orgMembersTable)
    .where(eq(orgMembersTable.user_id, user.id))
    .limit(1)

    const payload = {id: user.id, email: user.email, org_id: orgMember?.assigned_organization ?? null}
    const newAccessToken = await generateAccessToken(payload)
    const newRefreshToken = await generateRefreshToken(payload)

    const [update] = await db
    .update(usersTable)
    .set({
        refresh_token: newRefreshToken,
        refresh_token_expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })
    .where(eq(usersTable.id, user.id))
    .returning()

    if(!update) {
        throw ApiError.internal("Failed to update user")
    }

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        refresh_token_expiry: update.refresh_token_expiry
    }
}

const logout = async (cookies: {tokens: {refresh_token: string}}) => {
    const {refresh_token} = cookies.tokens;

    const decoded = JWT.decode(refresh_token) as Token

    const [update] = await db
    .update(usersTable)
    .set({
        refresh_token: null,
        refresh_token_expiry: null
    })
    .where(eq(usersTable.id, decoded.id))
    .returning()

    return
}

const addMember = async ({userId, orgId}: {userId: string, orgId: string}) => {
    if(!userId || !orgId) {
        throw ApiError.badRequest("User ID and organization ID are required")
    }

    const [user] = await db.select({id: usersTable.id, email: usersTable.email}).from(usersTable).where(eq(usersTable.id, userId)).limit(1)

    if(!user) {
        throw ApiError.notFound("User not found")
    }

    const [existing] = await db
    .select({id: orgMembersTable.id})
    .from(orgMembersTable)
    .where(and(
        eq(orgMembersTable.user_id, userId),
        eq(orgMembersTable.assigned_organization, orgId)
    ))
    .limit(1)

    if(existing) {
        throw ApiError.conflict("User is already a member of this organization")
    }

    const [member] = await db.insert(orgMembersTable).values({
        user_id: userId,
        assigned_organization: orgId
    }).returning()

    if(!member) {
        throw ApiError.internal("Failed to add member")
    }

    try {
        await sendMail({
            to: process.env.MAIL_TO!,
            subject: "Added to organization",
            text: `You have been added as a member of organization ${orgId}.`
        })
    } catch (err) {
        console.error("Failed to enqueue member notification:", err)
    }

    return member
}

const getMembers = async ({orgId}: {orgId: string}) => {
    if(!orgId) {
        throw ApiError.badRequest("Organization ID is required")
    }

    const members = await db
    .select({
        id: orgMembersTable.id,
        user_id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        assigned_organization: orgMembersTable.assigned_organization
    })
    .from(orgMembersTable)
    .innerJoin(usersTable, eq(usersTable.id, orgMembersTable.user_id))
    .where(eq(orgMembersTable.assigned_organization, orgId))

    return members
}

const updateMember = async ({userId, orgId}: {userId: string, orgId: string}) => {
    if(!userId || !orgId) {
        throw ApiError.badRequest("User ID and organization ID are required")
    }

    const [member] = await db
    .update(orgMembersTable)
    .set({assigned_organization: orgId})
    .where(and(
        eq(orgMembersTable.user_id, userId),
        eq(orgMembersTable.assigned_organization, orgId)
    ))
    .returning()

    if(!member) {
        throw ApiError.notFound("Member not found")
    }

    return member
}

const removeMember = async ({userId, orgId}: {userId: string, orgId: string}) => {
    if(!userId || !orgId) {
        throw ApiError.badRequest("User ID and organization ID are required")
    }

    const [member] = await db
    .delete(orgMembersTable)
    .where(and(
        eq(orgMembersTable.user_id, userId),
        eq(orgMembersTable.assigned_organization, orgId)
    ))
    .returning()

    if(!member) {
        throw ApiError.notFound("Member not found")
    }

    return member
}

export {
    register,
    login,
    refresh,
    logout,
    addMember,
    getMembers,
    updateMember,
    removeMember
}
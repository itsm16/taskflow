import type {Request, Response, NextFunction} from 'express'
import ApiError from '../../common/utils/api-error.js'
import JWT from 'jsonwebtoken'
import { orgMembersTable, usersTable } from './auth.schema.js'
import { db } from '../../common/db/index.js'
import { and, eq } from 'drizzle-orm'
import type { User } from './dto/auth.dto.js'

export const verifyToken = (token:string) => JWT.verify(token, process.env.JWT_SECRET as string)

type AuthedRequest = Request & {user: User}
type AuthHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown

const checkToken = (): AuthHandler => {
    return async (req, res, next) => {
        // const headerToken = req.headers.authorization?.split(' ')[1]
        const token = req.cookies?.tokens?.access_token

        if(!token){
            return res.status(401).json({ message: "Token is required" })
        }

        let decoded
        try {
            decoded = await verifyToken(token) as User
        } catch {
            return res.status(401).json({ message: "Invalid token" })
        }

        const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, decoded.id))
        .limit(1)

        if(!user){
            return res.status(401).json({ message: "User not found" })
        }

        ;(req as AuthedRequest).user = {
            id: user.id,
            name: user.name,
            email: user.email,
            org_id: decoded.org_id || null,
            role: user.role
        };

        next()
    }
}

const checkRole = (roles: string[]): AuthHandler => {
    return (req, res, next) => {
        const role = (req as AuthedRequest).user?.role

        if(!role || !roles.includes(role)){
            return res.status(403).json({ message: "Insufficient permissions" })
        }
        next()
    }
}

const checkOrg = (): AuthHandler => {
    return async (req, res, next) => {
        const orgId = req.body?.orgId ?? req.params.orgId ?? req.query.orgId
        const user = (req as AuthedRequest).user

        if(!user?.id || !orgId){
            return res.status(403).json({ message: "Organization ID is required" })
        }

        const [member] = await db
        .select()
        .from(orgMembersTable)
        .where(and(
            eq(orgMembersTable.user_id, user.id),
            eq(orgMembersTable.assigned_organization, orgId)
        ))
        .limit(1)

        if(!member){
            return res.status(403).json({ message: "Insufficient permissions" })
        }

        next()
    }
}

export {
    checkToken,
    checkRole,
    checkOrg
}
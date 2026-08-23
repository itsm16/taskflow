import ApiResponse from "../../common/utils/api-response.js"
import ApiError from "../../common/utils/api-error.js"
import * as authService from './auth.service.js'
import type { Response, Request } from "express"

const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

const COOKIE_PATH = "/"

const setRefreshCookie = ( {res, tokenName, token}: {res: Response, tokenName: string, token: object | string}) => {
    res.cookie(tokenName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: REFRESH_COOKIE_MAX_AGE,
        path: COOKIE_PATH
    })
}

const clearCookie = (res: Response, tokenName: string) => {
    res.clearCookie(tokenName, {
        path: COOKIE_PATH
    })
}

const register = async (req: Request, res: Response) => {
    const user = await authService.register(req.body)
    return ApiResponse.ok(res, "Registration successful", user)
}

const login = async (req: Request, res: Response) => {
    const result = await authService.login(req.body) as {user: any, accessToken: string, refreshToken: string}

    if (result && result.refreshToken) {
        setRefreshCookie({res, tokenName: "tokens",
            token: {
                access_token: result.accessToken,
                refresh_token: result.refreshToken
            }
        })
    }

    return ApiResponse.ok(res, "Login successful", result)
}

const refresh = async (req: Request, res: Response) => {
    const {tokens} = req.cookies;
    const result = await authService.refresh(tokens.refresh_token)
    if(result && result.refreshToken) {
        setRefreshCookie({
            res,
            tokenName: "tokens",
            token: {
                access_token: result.accessToken,
                refresh_token: result.refreshToken
            }
        })
    }
    return ApiResponse.ok(res, "Refresh successful", result)
}

const logout = async (req: Request, res: Response) => {
    if (!req?.cookies?.tokens) {
        return ApiResponse.notFound(res, "No cookies, already logged out")
    }
    const result = await authService.logout(req.cookies as {tokens: {refresh_token: string}})
    clearCookie(res, "tokens")
    return ApiResponse.ok(res, "Logout successful")
}

const addMember = async (req: Request, res: Response) => {
    const member = await authService.addMember({
        userId: req.params.userId as string,
        orgId: req.body.orgId
    })
    return ApiResponse.created(res, "Member added successfully", member)
}

const getMembers = async (req: Request, res: Response) => {
    const members = await authService.getMembers({orgId: req.params.orgId as string})
    return ApiResponse.ok(res, "Members fetched successfully", members)
}

const updateMember = async (req: Request, res: Response) => {
    const member = await authService.updateMember({
        userId: req.params.userId as string,
        orgId: req.body.orgId
    })
    return ApiResponse.ok(res, "Member updated successfully", member)
}

const removeMember = async (req: Request, res: Response) => {
    const member = await authService.removeMember({
        userId: req.params.userId as string,
        orgId: req.query.orgId as string
    })
    return ApiResponse.ok(res, "Member removed successfully", member)
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

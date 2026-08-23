import { Router } from "express";
import * as authController from './auth.controller.js'
import { checkToken, checkRole, checkOrg } from './auth.middleware.js'
import { validate } from "../../common/middleware/validate.middleware.js";
import { RegisterDto, LoginDto, AddMemberDto, UpdateMemberDto } from "./dto/auth.dto.js";

const authRouter: Router = Router()

authRouter.post("/register", validate(RegisterDto), authController.register)
authRouter.post("/login", validate(LoginDto), authController.login)
authRouter.post("/refresh", authController.refresh)
authRouter.post("/logout", authController.logout)

// members — DTO validates body orgId (uuid); checkOrg enforces membership
authRouter.post("/members/:userId", checkToken(), checkRole(["org_admin"]), checkOrg(), validate(AddMemberDto), authController.addMember)
authRouter.get("/members/:orgId", checkToken(), checkRole(["org_admin"]), checkOrg(), authController.getMembers)
authRouter.put("/members/:userId", checkToken(), checkRole(["org_admin"]), checkOrg(), validate(UpdateMemberDto), authController.updateMember)
authRouter.delete("/members/:userId", checkToken(), checkRole(["org_admin"]), checkOrg(), authController.removeMember)



export default authRouter

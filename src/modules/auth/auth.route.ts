import { Router } from "express";
import * as authController from './auth.controller.js'
import { checkToken, checkRole, checkOrg } from './auth.middleware.js'

const authRouter: Router = Router()

authRouter.post("/register", authController.register)
authRouter.post("/login", authController.login)
authRouter.post("/refresh", authController.refresh)
authRouter.post("/logout", authController.logout)

// members
authRouter.post("/members/:userId", checkToken(), checkRole(["org_admin"]), checkOrg(), authController.addMember)
authRouter.get("/members/:orgId", checkToken(), checkRole(["org_admin"]), checkOrg(), authController.getMembers)
authRouter.put("/members/:userId", checkToken(), checkRole(["org_admin"]), checkOrg(), authController.updateMember)
authRouter.delete("/members/:userId", checkToken(), checkRole(["org_admin"]), checkOrg(), authController.removeMember)



export default authRouter
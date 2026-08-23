import { Router } from "express";
import * as projectController from './project.controller.js'
import { checkRole, checkToken } from '../auth/auth.middleware.js'
import { checkOrg } from './project.middleware.js'

const projectRouter : Router = Router();

// projects
projectRouter.post("/", checkToken(), checkRole(["org_admin"]), checkOrg(), projectController.createProject)
projectRouter.get("/org/:orgId", checkToken(), checkRole(["org_admin"]), checkOrg(), projectController.getOrgProjects)
projectRouter.get("/:projId", checkToken(), checkRole(["org_admin"]), checkOrg(), projectController.getProject)
projectRouter.put("/:projId", checkToken(), checkRole(["org_admin"]), checkOrg(), projectController.updateProject)
projectRouter.delete("/:projId", checkToken(), checkRole(["org_admin"]), checkOrg(), projectController.deleteProject)

export default projectRouter;

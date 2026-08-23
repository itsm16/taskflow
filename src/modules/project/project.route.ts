import { Router } from "express";
import * as projectController from './project.controller.js'
import { checkRole, checkToken } from '../auth/auth.middleware.js'
import { checkOrg } from './project.middleware.js'
import { validate } from "../../common/middleware/validate.middleware.js";
import { CreateProjectDto, UpdateProjectDto } from "./dto/project.dto.js";

const projectRouter : Router = Router();

// projects — DTO types flow into project.service.ts (see dto/project.dto.ts)
projectRouter.post("/", checkToken(), checkRole(["org_admin"]), checkOrg(), validate(CreateProjectDto), projectController.createProject)
projectRouter.get("/org/:orgId", checkToken(), checkRole(["org_admin"]), checkOrg(), projectController.getOrgProjects)
projectRouter.get("/:projId", checkToken(), checkRole(["org_admin"]), checkOrg(), projectController.getProject)
projectRouter.put("/:projId", checkToken(), checkRole(["org_admin"]), checkOrg(), validate(UpdateProjectDto), projectController.updateProject)
projectRouter.delete("/:projId", checkToken(), checkRole(["org_admin"]), checkOrg(), projectController.deleteProject)

export default projectRouter;

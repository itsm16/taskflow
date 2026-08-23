import { Router } from "express";
import * as taskController from './task.controller.js'
import { checkToken } from '../auth/auth.middleware.js'
import { checkOrg } from '../project/project.middleware.js'

const taskRouter : Router = Router();

// tasks
taskRouter.post("/", checkToken(), checkOrg(), taskController.createTask)
taskRouter.get("/project/:projectId", checkToken(), checkOrg(), taskController.getProjectTasks)
taskRouter.get("/:taskId", checkToken(), checkOrg(), taskController.getTask)
taskRouter.put("/:taskId", checkToken(), checkOrg(), taskController.updateTask)
taskRouter.delete("/:taskId", checkToken(), checkOrg(), taskController.deleteTask)

export default taskRouter;

import { Router } from "express";
import * as taskController from './task.controller.js'
import { checkToken } from '../auth/auth.middleware.js'
import { checkOrg } from '../project/project.middleware.js'
import { validate } from "../../common/middleware/validate.middleware.js";
import { CreateTaskDto, UpdateTaskDto } from "./dto/task.dto.js";

const taskRouter : Router = Router();

// tasks — DTO types flow into task.service.ts (see dto/task.dto.ts)
taskRouter.post("/", checkToken(), checkOrg(), validate(CreateTaskDto), taskController.createTask)
taskRouter.get("/project/:projectId", checkToken(), checkOrg(), taskController.getProjectTasks)
taskRouter.get("/:taskId", checkToken(), checkOrg(), taskController.getTask)
taskRouter.put("/:taskId", checkToken(), checkOrg(), validate(UpdateTaskDto), taskController.updateTask)
taskRouter.delete("/:taskId", checkToken(), checkOrg(), taskController.deleteTask)

export default taskRouter;

import * as taskService from '../../modules/task/task.service.js';

const taskServiceWrapper = {
  createTask: (data: any) => taskService.createTask(data),
  getTask: (data: any) => taskService.getTask(data),
  getProjectTasks: (data: any) => taskService.getProjectTasks(data),
  updateTask: (data: any) => taskService.updateTask(data),
  deleteTask: (data: any) => taskService.deleteTask(data),
};

export default taskServiceWrapper;

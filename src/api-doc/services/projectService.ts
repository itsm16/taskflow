import * as projectService from '../../modules/project/project.service.js';

const projectServiceWrapper = {
  createProject: (data: any) => projectService.createProject(data),
  getProject: (data: any) => projectService.getProject(data),
  getOrgProjects: (data: any) => projectService.getOrgProjects(data),
  updateProject: (data: any) => projectService.updateProject(data),
  deleteProject: (data: any) => projectService.deleteProject(data),
};

export default projectServiceWrapper;

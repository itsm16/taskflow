import * as authService from '../../modules/auth/auth.service.js';

const authServiceWrapper = {
  register: (data: any) => authService.register(data),
  login: (data: any) => authService.login(data),
  refresh: (token: string) => authService.refresh(token),
  logout: (cookies: any) => authService.logout(cookies),
  addMember: (data: any) => authService.addMember(data),
  getMembers: (data: any) => authService.getMembers(data),
  updateMember: (data: any) => authService.updateMember(data),
  removeMember: (data: any) => authService.removeMember(data),
};

export default authServiceWrapper;

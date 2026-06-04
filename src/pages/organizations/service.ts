import { organizationService } from '@/services/organization';

export const organizationPageService = {
  getDetail: organizationService.getDetail.bind(organizationService),
  getMembers: organizationService.getMembers.bind(organizationService),
  create: organizationService.create.bind(organizationService),
  update: organizationService.update.bind(organizationService),
  updateSettings: organizationService.updateSettings.bind(organizationService),
  delete: organizationService.delete.bind(organizationService),
  inviteMember: organizationService.createInvitation.bind(organizationService),
  updateMemberRole: organizationService.updateMemberRole.bind(organizationService),
  removeMember: organizationService.removeMember.bind(organizationService),
  getQuota: organizationService.getQuota.bind(organizationService),
  getInvitations: organizationService.getInvitations.bind(organizationService),
};

export default organizationPageService;

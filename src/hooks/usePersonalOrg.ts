import { useMemo } from 'react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useOrganizationStore } from '@/stores/organizationStore';

export function usePersonalOrg() {
  const currentOrg = useWorkspaceStore((state) => state.currentOrg);
  const isPersonalOrgInStore = useOrganizationStore((state) => state.isPersonalOrg);

  const isPersonalOrg = useMemo(() => currentOrg?.org_type === 'personal', [currentOrg]);
  const isAdmin = useMemo(() => currentOrg?.role === 'admin', [currentOrg]);
  const isOwner = useMemo(() => Boolean(currentOrg?.is_owner), [currentOrg]);

  return {
    isPersonalOrg,
    isAdmin,
    isOwner,
    canInvite: isAdmin && !isPersonalOrg,
    canDelete: isOwner && !isPersonalOrg,
    canTransfer: false,
    checkIsPersonalOrg: (orgId: string) => isPersonalOrgInStore(orgId),
  };
}

export default usePersonalOrg;

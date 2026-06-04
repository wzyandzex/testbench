type PersistedAuthUser = {
  role?: string;
  orgRole?: string;
  current_org_role?: string;
} | null;

type PersistedAuthShape = {
  state?: {
    user?: PersistedAuthUser;
  };
  user?: PersistedAuthUser;
};

export function readPersistedAuthUser(): PersistedAuthUser {
  try {
    const raw = localStorage.getItem('auth-storage') || localStorage.getItem('auth');
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PersistedAuthShape;
    return parsed?.state?.user || parsed?.user || null;
  } catch {
    return null;
  }
}

export function isPersistedOrgAdmin(): boolean {
  const user = readPersistedAuthUser();
  if (!user) {
    return false;
  }

  return user.role === 'admin' || user.orgRole === 'admin' || user.current_org_role === 'admin';
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';

type AuthSessionScope = {
  currentOrgID?: string | null;
  currentOrgRole?: string | null;
};

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;

  setAuth: (user: User, accessToken: string, refreshToken: string, sessionScope?: AuthSessionScope) => void;
  updateUser: (user: Partial<User>) => void;
  setTokens: (accessToken: string, refreshToken: string, sessionScope?: AuthSessionScope) => void;
  clearAuth: () => void;
  syncPersistedAuth: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

function computeIsAuthenticated(user: User | null, accessToken: string | null) {
  return Boolean(user && accessToken);
}

function normalizeAuthUser(user: User, sessionScope?: AuthSessionScope): User {
  const resolvedCurrentOrgID = sessionScope?.currentOrgID ?? user.current_org_id ?? undefined;
  const resolvedCurrentOrgRole =
    sessionScope?.currentOrgRole ?? user.current_org_role ?? user.orgRole ?? undefined;

  return {
    ...user,
    ...(resolvedCurrentOrgID ? { current_org_id: resolvedCurrentOrgID } : {}),
    ...(resolvedCurrentOrgRole
      ? {
          current_org_role: resolvedCurrentOrgRole as User['current_org_role'],
          orgRole: resolvedCurrentOrgRole as User['orgRole'],
        }
      : {}),
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      hasHydrated: false,

      setAuth: (user, accessToken, refreshToken, sessionScope) => {
        const normalizedUser = normalizeAuthUser(user, sessionScope);
        set({
          user: normalizedUser,
          accessToken,
          refreshToken,
          isAuthenticated: computeIsAuthenticated(normalizedUser, accessToken),
          hasHydrated: true,
        });
      },

      updateUser: (user) => {
        set((state) => {
          const nextUser = state.user ? normalizeAuthUser({ ...state.user, ...user }) : null;
          return {
            user: nextUser,
            isAuthenticated: computeIsAuthenticated(nextUser, state.accessToken),
          };
        });
      },

      setTokens: (accessToken, refreshToken, sessionScope) => {
        set((state) => {
          const nextUser = state.user ? normalizeAuthUser(state.user, sessionScope) : state.user;
          return {
            user: nextUser,
            accessToken,
            refreshToken,
            isAuthenticated: computeIsAuthenticated(nextUser, accessToken),
            hasHydrated: true,
          };
        });
      },

      clearAuth: () => {
        import('./workspaceStore').then(({ useWorkspaceStore }) => {
          useWorkspaceStore.getState().clearWorkspace();
        });
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          hasHydrated: true,
        });
      },

      syncPersistedAuth: () => {
        set((state) => ({
          isAuthenticated: computeIsAuthenticated(state.user, state.accessToken),
          hasHydrated: true,
        }));
      },

      hasPermission: () => {
        const { user } = get();
        if (!user) return false;
        if (user.role === 'admin' || user.orgRole === 'admin') return true;
        return true;
      },

      hasRole: (roles) => {
        const { user } = get();
        if (!user) return false;
        return roles.includes(user.role);
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.syncPersistedAuth();
      },
    }
  )
);

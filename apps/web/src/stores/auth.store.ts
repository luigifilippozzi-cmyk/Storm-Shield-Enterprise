import { create } from 'zustand';

interface AuthState {
  user: any | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  setUser: (user: any) => void;
  setTenantId: (tenantId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenantId: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setTenantId: (tenantId) => set({ tenantId }),
  logout: () => set({ user: null, tenantId: null, isAuthenticated: false }),
}));

import { create } from 'zustand';
import { authStorage, parseJwt } from '../lib/auth';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string) => void;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setToken: (token) => {
    authStorage.setToken(token);
    const payload = parseJwt(token);
    if (payload) {
      set({
        user: {
          id: payload.userId,
          email: payload.sub,
          name: payload.name || payload.sub,
          role: payload.role,
          organization: payload.organization,
          createdAt: new Date().toISOString(),
        },
        isAuthenticated: true,
      });
    }
  },

  logout: () => {
    authStorage.removeToken();
    set({ user: null, isAuthenticated: false });
  },

  initAuth: () => {
    const token = authStorage.getToken();
    if (token) {
      const payload = parseJwt(token);
      if (payload) {
        set({
          user: {
            id: payload.userId,
            email: payload.sub,
            name: payload.name || payload.sub,
            role: payload.role,
            organization: payload.organization,
            createdAt: new Date().toISOString(),
          },
          isAuthenticated: true,
        });
      }
    }
  },
}));

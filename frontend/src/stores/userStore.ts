import { create } from "zustand";
import { api, clearAuthToken } from "../lib/api/client";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferred_currency: string;
  email_notifications_enabled: boolean;
  budgetCaps?: Record<string, number>;
  budget_caps?: Record<string, number>;
  provider: string;
  created_at: string;
  updated_at: string;
}

interface UserStore {
  user: User | null;
  loading: boolean;

  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  loading: true,

  fetchUser: async () => {
    set({ loading: true });
    try {
      const data = await api.auth.me();
      set({ user: data });
    } catch {
      set({ user: null });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    try {
      await api.auth.logout();
    } finally {
      clearAuthToken();
    }
    set({ user: null });
  },

  refreshUser: async () => {
    try {
      const data = await api.auth.me();
      set({ user: data });
    } catch {
      set({ user: null });
    }
  },
}));

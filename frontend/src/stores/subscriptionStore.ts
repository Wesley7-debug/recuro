import { create } from "zustand";
import { api } from "../lib/api/client";

export interface Subscription {
  _id: string;
  userId: string;
  name: string;
  provider: string;
  category: string;
  amount: number;
  currency: string;
  billingCycle: "weekly" | "monthly" | "quarterly" | "yearly";
  nextBillingDate: string;
  status: "active" | "cancelled" | "paused";
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionFilters {
  search: string;
  status: string;
}

interface SubscriptionStore {
  subscriptions: Subscription[];
  loading: boolean;
  filters: SubscriptionFilters;

  setFilters: (filters: Partial<SubscriptionFilters>) => void;
  fetchSubscriptions: () => Promise<void>;
  createSubscription: (data: Omit<Subscription, "_id" | "userId" | "createdAt" | "updatedAt">) => Promise<void>;
  updateSubscription: (id: string, data: Partial<Subscription>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  subscriptions: [],
  loading: true,
  filters: { search: "", status: "" },

  setFilters: (newFilters) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }));
    get().fetchSubscriptions();
  },

  fetchSubscriptions: async () => {
    set({ loading: true });
    try {
      const { filters } = get();
      const data = await api.subscriptions.list(filters);
      set({ subscriptions: data });
    } catch {
      // silently fail
    } finally {
      set({ loading: false });
    }
  },

  createSubscription: async (data) => {
    await api.subscriptions.create(data);
    await get().fetchSubscriptions();
  },

  updateSubscription: async (id, data) => {
    await api.subscriptions.update(id, data);
    await get().fetchSubscriptions();
  },

  deleteSubscription: async (id) => {
    await api.subscriptions.delete(id);
    await get().fetchSubscriptions();
  },
}));

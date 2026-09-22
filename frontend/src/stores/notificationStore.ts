import { create } from "zustand";
import { api } from "../lib/api/client";

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;

  fetchNotifications: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: true,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const data = await api.notifications.list();
      const unreadCount = data.filter((n: Notification) => !n.read).length;
      set({ notifications: data, unreadCount });
    } catch {
      // silently fail
    } finally {
      set({ loading: false });
    }
  },

  markRead: async (id) => {
    await api.notifications.markRead(id);
    await get().fetchNotifications();
  },

  markAllRead: async () => {
    await api.notifications.markAllRead();
    await get().fetchNotifications();
  },
}));

import { create } from 'zustand';
import { notificationsAPI } from '../api/client';

export const useNotificationsStore = create((set, get) => ({
  // State
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  // Actions
  fetchNotifications: async (unread_only = false, type = null) => {
    set({ loading: true, error: null });
    try {
      const response = await notificationsAPI.getNotifications(unread_only, type, 50, 0);
      // Backend returns { notifications: [], total, unread_count, ... }
      const notifications = response.data.notifications || response.data.rows || response.data || [];
      const unreadCount = response.data.unread_count ?? notifications.filter(n => !n.read).length;
      set({ notifications, unreadCount, loading: false });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      set({ error: error.message, loading: false, notifications: [], unreadCount: 0 });
    }
  },

  markAsRead: async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      const notifications = get().notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      );
      const unreadCount = notifications.filter(n => !n.read).length;
      set({ notifications, unreadCount });
    } catch (error) {
      set({ error: error.message });
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationsAPI.markAllAsRead();
      const notifications = get().notifications.map(n => ({ ...n, read: true }));
      set({ notifications, unreadCount: 0 });
    } catch (error) {
      set({ error: error.message });
    }
  },

  deleteNotification: async (id) => {
    try {
      await notificationsAPI.deleteNotification(id);
      const notifications = get().notifications.filter(n => n.id !== id);
      const unreadCount = notifications.filter(n => !n.read).length;
      set({ notifications, unreadCount });
    } catch (error) {
      set({ error: error.message });
    }
  },

  addNotification: (notification) => {
    const notifications = [notification, ...get().notifications];
    const unreadCount = notifications.filter(n => !n.read).length;
    set({ notifications, unreadCount });
  },

  clearError: () => set({ error: null }),
}));

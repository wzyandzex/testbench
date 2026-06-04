import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { notificationService } from '@/services/notification';
import type { Notification, NotificationStats } from '@/types/notification';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  stats: NotificationStats | null;
  loading: boolean;
  error: string | null;
  fetchNotifications: (params?: { page?: number; pageSize?: number }) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  fetchStats: () => Promise<void>;
  refresh: () => Promise<void>;
  markAsRead: (ids: string[], comment?: string) => Promise<void>;
  markAllAsRead: (comment?: string) => Promise<void>;
  rejectNotification: (id: string, comment?: string) => Promise<void>;
  addNotification: (notification: Notification) => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
}

function applyAckState(
  notifications: Notification[],
  ids: string[],
  ackStatus: Notification['ackStatus'],
  comment?: string,
) {
  const ackedAt = new Date().toISOString();

  return notifications.map((item) =>
    ids.includes(item.id)
      ? {
          ...item,
          ackStatus,
          ackComment: comment || item.ackComment,
          ackedAt,
          readAt: ackedAt,
          status: 'read' as const,
        }
      : item,
  );
}

export const useNotificationStore = create<NotificationState>()(
  subscribeWithSelector((set, get) => ({
    notifications: [],
    unreadCount: 0,
    stats: null,
    loading: false,
    error: null,

    fetchNotifications: async (params) => {
      set({ loading: true, error: null });
      try {
        const response = await notificationService.getList({
          page: params?.page ?? 1,
          pageSize: params?.pageSize ?? 20,
          sortBy: 'timestamp',
          sortOrder: 'desc',
        });
        set({
          notifications: response.list,
          loading: false,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load notifications',
          loading: false,
        });
      }
    },

    fetchUnreadCount: async () => {
      try {
        const unreadCount = await notificationService.getPendingCount();
        set({ unreadCount });
      } catch (error) {
        console.error('Failed to load pending count:', error);
      }
    },

    fetchStats: async () => {
      try {
        const stats = await notificationService.getStats();
        set({ stats });
      } catch (error) {
        console.error('Failed to load notification stats:', error);
      }
    },

    refresh: async () => {
      await Promise.all([
        get().fetchNotifications(),
        get().fetchUnreadCount(),
        get().fetchStats(),
      ]);
    },

    markAsRead: async (ids, comment) => {
      if (ids.length === 0) {
        return;
      }

      try {
        await notificationService.bulkAcknowledge({ ids, comment });
        set((state) => ({
          notifications: applyAckState(state.notifications, ids, 'acked', comment),
          unreadCount: Math.max(0, state.unreadCount - ids.length),
        }));
        await get().fetchStats();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to acknowledge notifications' });
      }
    },

    markAllAsRead: async (comment) => {
      const ids = get()
        .notifications
        .filter((item) => item.ackStatus === 'pending')
        .map((item) => item.id);

      if (ids.length === 0) {
        return;
      }

      await get().markAsRead(ids, comment);
    },

    rejectNotification: async (id, comment) => {
      try {
        await notificationService.reject(id, { comment });
        set((state) => ({
          notifications: applyAckState(state.notifications, [id], 'rejected', comment),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
        await get().fetchStats();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to reject notification' });
      }
    },

    addNotification: (notification) => {
      set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadCount: notification.ackStatus === 'pending' ? state.unreadCount + 1 : state.unreadCount,
      }));
    },

    updateNotification: (id, updates) => {
      set((state) => ({
        notifications: state.notifications.map((item) =>
          item.id === id ? { ...item, ...updates } : item,
        ),
      }));
    },
  })),
);

export const useNotifications = () => useNotificationStore((state) => state.notifications);
export const useUnreadCount = () => useNotificationStore((state) => state.unreadCount);
export const useNotificationStats = () => useNotificationStore((state) => state.stats);

export default useNotificationStore;

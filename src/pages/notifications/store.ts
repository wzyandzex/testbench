import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { notificationPageService } from './service';
import type {
  DeadLetterEntry,
  DeadLetterListParams,
  HistoryExportFormat,
  Notification,
  NotificationListParams,
  NotificationStats,
} from '@/types/notification';

type NotificationTab = 'history' | 'dlq';

interface NotificationPageState {
  activeTab: NotificationTab;
  notifications: Notification[];
  total: number;
  page: number;
  pageSize: number;
  pendingCount: number;
  stats: NotificationStats | null;
  selectedIds: string[];
  loading: boolean;
  detailLoading: boolean;
  exporting: boolean;
  error: string | null;
  activeNotification: Notification | null;
  filters: NotificationListParams;
  dlqEntries: DeadLetterEntry[];
  dlqTotal: number;
  dlqPage: number;
  dlqPageSize: number;
  dlqCount: number;
  dlqLoading: boolean;
  activeDeadLetter: DeadLetterEntry | null;
  dlqFilters: DeadLetterListParams;
  initialize: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  refreshSummaries: () => Promise<void>;
  setActiveTab: (tab: NotificationTab) => Promise<void>;
  setFilters: (patch: Partial<NotificationListParams>) => Promise<void>;
  setPage: (page: number, pageSize?: number) => Promise<void>;
  toggleSelection: (id: string) => void;
  selectAllVisible: () => void;
  clearSelection: () => void;
  openNotification: (id: string) => Promise<void>;
  closeNotification: () => void;
  acknowledge: (id: string, comment?: string) => Promise<void>;
  reject: (id: string, comment?: string) => Promise<void>;
  bulkAcknowledge: (comment?: string) => Promise<void>;
  exportHistory: (format: HistoryExportFormat) => Promise<Blob>;
  refreshDLQ: () => Promise<void>;
  setDLQFilters: (patch: Partial<DeadLetterListParams>) => Promise<void>;
  setDLQPage: (page: number, pageSize?: number) => Promise<void>;
  openDeadLetter: (id: string) => Promise<void>;
  closeDeadLetter: () => void;
  replayDeadLetter: (id: string) => Promise<void>;
  removeDeadLetter: (id: string) => Promise<void>;
}

const defaultFilters: NotificationListParams = {
  page: 1,
  pageSize: 12,
  sortBy: 'timestamp',
  sortOrder: 'desc',
};

const defaultDLQFilters: DeadLetterListParams = {
  page: 1,
  pageSize: 8,
  sortOrder: 'desc',
};

function updateAckState(
  list: Notification[],
  ids: string[],
  ackStatus: Notification['ackStatus'],
  comment?: string,
) {
  const ackedAt = new Date().toISOString();

  return list.map((item) =>
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

export const useNotificationPageStore = create<NotificationPageState>()(
  subscribeWithSelector((set, get) => ({
    activeTab: 'history',
    notifications: [],
    total: 0,
    page: defaultFilters.page ?? 1,
    pageSize: defaultFilters.pageSize ?? 12,
    pendingCount: 0,
    stats: null,
    selectedIds: [],
    loading: false,
    detailLoading: false,
    exporting: false,
    error: null,
    activeNotification: null,
    filters: defaultFilters,
    dlqEntries: [],
    dlqTotal: 0,
    dlqPage: defaultDLQFilters.page ?? 1,
    dlqPageSize: defaultDLQFilters.pageSize ?? 8,
    dlqCount: 0,
    dlqLoading: false,
    activeDeadLetter: null,
    dlqFilters: defaultDLQFilters,

    initialize: async () => {
      await Promise.all([get().refreshHistory(), get().refreshSummaries()]);
    },

    refreshHistory: async () => {
      set({ loading: true, error: null });
      try {
        const { filters } = get();
        const response = await notificationPageService.getList(filters);
        set({
          notifications: response.list,
          total: response.total,
          page: response.page,
          pageSize: response.pageSize,
          selectedIds: [],
          loading: false,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load notification history',
          loading: false,
        });
      }
    },

    refreshSummaries: async () => {
      try {
        const [pendingCount, stats, dlqCount] = await Promise.all([
          notificationPageService.getPendingCount(),
          notificationPageService.getStats(),
          notificationPageService.getDLQCount(),
        ]);
        set({ pendingCount, stats, dlqCount });
      } catch (error) {
        console.error('Failed to refresh notification summaries:', error);
      }
    },

    setActiveTab: async (tab) => {
      set({ activeTab: tab, error: null });
      if (tab === 'dlq' && get().dlqEntries.length === 0) {
        await get().refreshDLQ();
      }
    },

    setFilters: async (patch) => {
      const nextFilters = {
        ...get().filters,
        ...patch,
        page: patch.page ?? 1,
      };
      set({ filters: nextFilters });
      await get().refreshHistory();
    },

    setPage: async (page, pageSize) => {
      const nextPageSize = pageSize ?? get().pageSize;
      set({
        filters: {
          ...get().filters,
          page,
          pageSize: nextPageSize,
        },
      });
      await get().refreshHistory();
    },

    toggleSelection: (id) => {
      set((state) => ({
        selectedIds: state.selectedIds.includes(id)
          ? state.selectedIds.filter((value) => value !== id)
          : [...state.selectedIds, id],
      }));
    },

    selectAllVisible: () => {
      set((state) => ({
        selectedIds: state.notifications
          .filter((item) => item.ackStatus === 'pending')
          .map((item) => item.id),
      }));
    },

    clearSelection: () => {
      set({ selectedIds: [] });
    },

    openNotification: async (id) => {
      set({ detailLoading: true, error: null });
      try {
        const notification = await notificationPageService.getDetail(id);
        set({
          activeNotification: notification,
          detailLoading: false,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load notification detail',
          detailLoading: false,
        });
      }
    },

    closeNotification: () => {
      set({ activeNotification: null });
    },

    acknowledge: async (id, comment) => {
      try {
        await notificationPageService.acknowledge(id, { comment });
        set((state) => {
          const notifications = updateAckState(state.notifications, [id], 'acked', comment);
          const activeNotification =
            state.activeNotification?.id === id
              ? { ...state.activeNotification, ...notifications.find((item) => item.id === id) }
              : state.activeNotification;

          return {
            notifications,
            selectedIds: state.selectedIds.filter((value) => value !== id),
            activeNotification,
            pendingCount: Math.max(0, state.pendingCount - 1),
          };
        });
        await get().refreshSummaries();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to acknowledge notification' });
      }
    },

    reject: async (id, comment) => {
      try {
        await notificationPageService.reject(id, { comment });
        set((state) => {
          const notifications = updateAckState(state.notifications, [id], 'rejected', comment);
          const activeNotification =
            state.activeNotification?.id === id
              ? { ...state.activeNotification, ...notifications.find((item) => item.id === id) }
              : state.activeNotification;

          return {
            notifications,
            selectedIds: state.selectedIds.filter((value) => value !== id),
            activeNotification,
            pendingCount: Math.max(0, state.pendingCount - 1),
          };
        });
        await get().refreshSummaries();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to reject notification' });
      }
    },

    bulkAcknowledge: async (comment) => {
      const ids = get().selectedIds;
      if (ids.length === 0) {
        return;
      }

      try {
        await notificationPageService.bulkAcknowledge({ ids, comment });
        set((state) => ({
          notifications: updateAckState(state.notifications, ids, 'acked', comment),
          selectedIds: [],
          pendingCount: Math.max(0, state.pendingCount - ids.length),
        }));
        await get().refreshSummaries();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to bulk acknowledge notifications' });
      }
    },

    exportHistory: async (format) => {
      set({ exporting: true });
      try {
        return await notificationPageService.exportHistory(format, get().filters);
      } finally {
        set({ exporting: false });
      }
    },

    refreshDLQ: async () => {
      set({ dlqLoading: true, error: null });
      try {
        const response = await notificationPageService.getDLQList(get().dlqFilters);
        set({
          dlqEntries: response.entries,
          dlqTotal: response.total,
          dlqPage: response.page,
          dlqPageSize: response.pageSize,
          dlqLoading: false,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load dead letters',
          dlqLoading: false,
        });
      }
    },

    setDLQFilters: async (patch) => {
      const nextFilters = {
        ...get().dlqFilters,
        ...patch,
        page: patch.page ?? 1,
      };
      set({ dlqFilters: nextFilters });
      await get().refreshDLQ();
    },

    setDLQPage: async (page, pageSize) => {
      const nextPageSize = pageSize ?? get().dlqPageSize;
      set({
        dlqFilters: {
          ...get().dlqFilters,
          page,
          pageSize: nextPageSize,
        },
      });
      await get().refreshDLQ();
    },

    openDeadLetter: async (id) => {
      set({ detailLoading: true, error: null });
      try {
        const entry = await notificationPageService.getDLQDetail(id);
        set({
          activeDeadLetter: entry,
          detailLoading: false,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load dead letter detail',
          detailLoading: false,
        });
      }
    },

    closeDeadLetter: () => {
      set({ activeDeadLetter: null });
    },

    replayDeadLetter: async (id) => {
      try {
        await notificationPageService.replayDLQ(id);
        set((state) => ({
          dlqEntries: state.dlqEntries.filter((entry) => entry.id !== id),
          dlqTotal: Math.max(0, state.dlqTotal - 1),
          dlqCount: Math.max(0, state.dlqCount - 1),
          activeDeadLetter: state.activeDeadLetter?.id === id ? null : state.activeDeadLetter,
        }));
        await get().refreshSummaries();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to replay dead letter' });
      }
    },

    removeDeadLetter: async (id) => {
      try {
        await notificationPageService.removeDLQ(id);
        set((state) => ({
          dlqEntries: state.dlqEntries.filter((entry) => entry.id !== id),
          dlqTotal: Math.max(0, state.dlqTotal - 1),
          dlqCount: Math.max(0, state.dlqCount - 1),
          activeDeadLetter: state.activeDeadLetter?.id === id ? null : state.activeDeadLetter,
        }));
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to remove dead letter' });
      }
    },
  })),
);

export default useNotificationPageStore;

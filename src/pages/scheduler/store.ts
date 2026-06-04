import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { schedulerPageService } from './service';
import type {
  CreateScheduledTaskRequest,
  ScheduledTask,
  ScheduledTaskDetail,
  ScheduledTaskStatus,
  TaskRunListResponse,
  UpdateScheduledTaskRequest,
} from '@/types/api/scheduled-task';

interface SchedulerListParams {
  page?: number;
  page_size?: number;
  enabled?: boolean;
  status?: ScheduledTaskStatus;
}

interface SchedulerState {
  tasks: ScheduledTask[];
  currentTask: ScheduledTaskDetail | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
  listParams: SchedulerListParams;
  fetchTasks: (params?: SchedulerListParams) => Promise<void>;
  fetchTaskDetail: (id: string) => Promise<void>;
  createTask: (data: CreateScheduledTaskRequest) => Promise<void>;
  updateTask: (id: string, data: UpdateScheduledTaskRequest) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setTaskEnabled: (id: string, enabled: boolean) => Promise<void>;
  triggerTask: (id: string) => Promise<void>;
  getTaskRuns: (id: string, params?: { page?: number; page_size?: number }) => Promise<TaskRunListResponse>;
  clearCurrentTask: () => void;
}

const DEFAULT_LIST_PARAMS: SchedulerListParams = {
  page: 1,
  page_size: 20,
};

export const useSchedulerPageStore = create<SchedulerState>()(
  subscribeWithSelector((set, get) => ({
    tasks: [],
    currentTask: null,
    loading: false,
    error: null,
    totalCount: 0,
    listParams: DEFAULT_LIST_PARAMS,

    fetchTasks: async (params) => {
      const nextParams = {
        ...get().listParams,
        ...params,
      };

      set({
        loading: true,
        error: null,
        listParams: nextParams,
      });

      try {
        const response = await schedulerPageService.getList(nextParams);
        set({
          tasks: response.items,
          totalCount: response.total,
          loading: false,
        });
      } catch (error) {
        set({
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : '\u52a0\u8f7d\u8c03\u5ea6\u4efb\u52a1\u5931\u8d25',
        });
      }
    },

    fetchTaskDetail: async (id) => {
      set({
        loading: true,
        error: null,
      });

      try {
        const detail = await schedulerPageService.getDetail(id);
        set({
          currentTask: detail,
          loading: false,
        });
      } catch (error) {
        set({
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : '\u52a0\u8f7d\u8c03\u5ea6\u4efb\u52a1\u8be6\u60c5\u5931\u8d25',
        });
      }
    },

    createTask: async (data) => {
      await schedulerPageService.create(data);
      await get().fetchTasks(get().listParams);
    },

    updateTask: async (id, data) => {
      await schedulerPageService.update(id, data);
      await get().fetchTasks(get().listParams);
    },

    deleteTask: async (id) => {
      await schedulerPageService.delete(id);

      if (get().currentTask?.id === id) {
        set({ currentTask: null });
      }

      await get().fetchTasks(get().listParams);
    },

    setTaskEnabled: async (id, enabled) => {
      await schedulerPageService.setEnabled(id, enabled);
      await get().fetchTasks(get().listParams);
    },

    triggerTask: async (id) => {
      await schedulerPageService.trigger(id);
    },

    getTaskRuns: (id, params) => {
      return schedulerPageService.getRuns(id, params);
    },

    clearCurrentTask: () => {
      set({ currentTask: null });
    },
  }))
);

export default useSchedulerPageStore;

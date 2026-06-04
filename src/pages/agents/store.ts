import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { agentPageService, type AgentDetail, type AgentPageFilters } from './service';
import type { Agent, AgentStatus, CreateAgentDto, UpdateAgentDto } from '@/types/api/agent';

interface AgentListSummary {
  totalCount: number;
  loadedCount: number;
  activeLoadedCount: number;
  maintainedLoadedCount: number;
}

interface AgentPageState {
  agents: Agent[];
  currentAgent: AgentDetail | null;
  filters: AgentPageFilters;
  page: number;
  pageSize: number;
  totalCount: number;
  loadedCount: number;
  activeLoadedCount: number;
  maintainedLoadedCount: number;
  listLoading: boolean;
  detailLoading: boolean;
  error: string | null;
  fetchAgents: () => Promise<void>;
  fetchAgentDetail: (id: string) => Promise<void>;
  setFilters: (filters: Partial<AgentPageFilters>) => void;
  setPage: (page: number, pageSize?: number) => void;
  clearCurrentAgent: () => void;
  createAgent: (payload: CreateAgentDto) => Promise<Agent>;
  updateAgent: (id: string, payload: UpdateAgentDto) => Promise<Agent>;
  deleteAgent: (id: string) => Promise<void>;
  updateAgentStatus: (id: string, status: AgentStatus) => Promise<Agent>;
}

function deriveSummary(agents: Agent[], totalCount: number): AgentListSummary {
  let activeLoadedCount = 0;
  let maintainedLoadedCount = 0;

  for (const agent of agents) {
    if (agent.status === 'active') {
      activeLoadedCount += 1;
    }
    if (agent.status === 'maintained') {
      maintainedLoadedCount += 1;
    }
  }

  return {
    totalCount,
    loadedCount: agents.length,
    activeLoadedCount,
    maintainedLoadedCount,
  };
}

export const useAgentPageStore = create<AgentPageState>()(
  subscribeWithSelector((set, get) => ({
    agents: [],
    currentAgent: null,
    filters: {},
    page: 1,
    pageSize: 20,
    totalCount: 0,
    loadedCount: 0,
    activeLoadedCount: 0,
    maintainedLoadedCount: 0,
    listLoading: false,
    detailLoading: false,
    error: null,

    fetchAgents: async () => {
      set({ listLoading: true, error: null });

      try {
        const state = get();
        const response = await agentPageService.getList({
          ...state.filters,
          page: state.page,
          page_size: state.pageSize,
          order_by: 'updated_at',
          order_dir: 'desc',
        });
        const summary = deriveSummary(response.data, response.total);

        set({
          agents: response.data,
          totalCount: summary.totalCount,
          loadedCount: summary.loadedCount,
          activeLoadedCount: summary.activeLoadedCount,
          maintainedLoadedCount: summary.maintainedLoadedCount,
          listLoading: false,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load agents',
          listLoading: false,
        });
      }
    },

    fetchAgentDetail: async (id: string) => {
      set({ detailLoading: true, error: null });

      try {
        const detail = await agentPageService.getDetail(id);
        set({ currentAgent: detail, detailLoading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to load agent details',
          detailLoading: false,
        });
      }
    },

    setFilters: (filters) => {
      set((state) => ({
        filters: { ...state.filters, ...filters },
        page: 1,
      }));
    },

    setPage: (page, pageSize) => {
      set((state) => ({
        page,
        pageSize: pageSize ?? state.pageSize,
      }));
    },

    clearCurrentAgent: () => {
      set({ currentAgent: null });
    },

    createAgent: async (payload) => {
      const created = await agentPageService.create(payload);
      await get().fetchAgents();
      return created;
    },

    updateAgent: async (id, payload) => {
      const updated = await agentPageService.update(id, payload);
      set((state) => ({
        agents: state.agents.map((agent) => (agent.id === id ? updated : agent)),
        currentAgent: state.currentAgent?.id === id
          ? {
              ...state.currentAgent,
              ...updated,
            }
          : state.currentAgent,
      }));
      return updated;
    },

    deleteAgent: async (id) => {
      await agentPageService.delete(id);
      set((state) => {
        const agents = state.agents.filter((agent) => agent.id !== id);
        const summary = deriveSummary(agents, Math.max(0, state.totalCount - 1));
        return {
          agents,
          currentAgent: state.currentAgent?.id === id ? null : state.currentAgent,
          totalCount: summary.totalCount,
          loadedCount: summary.loadedCount,
          activeLoadedCount: summary.activeLoadedCount,
          maintainedLoadedCount: summary.maintainedLoadedCount,
        };
      });
    },

    updateAgentStatus: async (id, status) => {
      const updated = await agentPageService.updateStatus(id, status);
      set((state) => {
        const agents = state.agents.map((agent) => (agent.id === id ? updated : agent));
        const summary = deriveSummary(agents, state.totalCount);
        return {
          agents,
          currentAgent: state.currentAgent?.id === id
            ? {
                ...state.currentAgent,
                ...updated,
              }
            : state.currentAgent,
          totalCount: summary.totalCount,
          loadedCount: summary.loadedCount,
          activeLoadedCount: summary.activeLoadedCount,
          maintainedLoadedCount: summary.maintainedLoadedCount,
        };
      });
      return updated;
    },
  })),
);

export const useAgentSummary = () =>
  useAgentPageStore((state) => ({
    totalCount: state.totalCount,
    loadedCount: state.loadedCount,
    activeLoadedCount: state.activeLoadedCount,
    maintainedLoadedCount: state.maintainedLoadedCount,
  }));

export default useAgentPageStore;

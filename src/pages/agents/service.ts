import { agentService } from '@/services/agent';
import type {
  Agent,
  AgentExecutionResult,
  AgentHealthStatus,
  AgentListParams,
  AgentStats,
  AgentStatus,
  AgentType,
  CreateAgentDto,
  ExecuteAgentDto,
  UpdateAgentDto,
} from '@/types/api/agent';

export interface AgentDetail extends Agent {
  stats: AgentStats;
}

export interface AgentPageFilters {
  keyword?: string;
  types?: AgentType[];
  status?: AgentStatus[];
}

const EMPTY_STATS: AgentStats = {
  agent_id: '',
  total_executions: 0,
  success_executions: 0,
  failed_executions: 0,
  timeout_executions: 0,
  success_rate: 0,
  timeout_rate: 0,
  avg_duration: 0,
  min_duration: 0,
  max_duration: 0,
  total_input_tokens: 0,
  total_output_tokens: 0,
  total_tokens: 0,
  avg_tokens: 0,
  avg_steps: 0,
  avg_tool_calls: 0,
};

function mergeAgentDetail(agent: Agent, stats?: AgentStats): AgentDetail {
  return {
    ...agent,
    stats: {
      ...EMPTY_STATS,
      agent_id: agent.id,
      ...stats,
    },
  };
}

export const agentPageService = {
  getList: async (
    params: AgentPageFilters & Pick<AgentListParams, 'page' | 'page_size' | 'order_by' | 'order_dir'>,
  ) => {
    return agentService.list({
      page: params.page,
      page_size: params.page_size,
      name_like: params.keyword,
      types: params.types,
      status: params.status,
      order_by: params.order_by,
      order_dir: params.order_dir,
    });
  },

  getDetail: async (id: string): Promise<AgentDetail> => {
    const [agent, stats] = await Promise.all([agentService.get(id), agentService.getStats(id)]);
    return mergeAgentDetail(agent, stats);
  },

  create: async (payload: CreateAgentDto) => {
    return agentService.create(payload);
  },

  update: async (id: string, payload: UpdateAgentDto) => {
    return agentService.update(id, payload);
  },

  delete: async (id: string) => {
    return agentService.delete(id);
  },

  updateStatus: async (id: string, status: AgentStatus) => {
    return agentService.update(id, { status });
  },

  getHealth: async (id: string): Promise<AgentHealthStatus> => {
    return agentService.getHealth(id);
  },

  syncToRegistry: async (id: string) => {
    return agentService.syncToRegistry(id);
  },

  restoreDefault: async () => {
    return agentService.restoreDefault();
  },

  execute: async (id: string, payload: ExecuteAgentDto): Promise<AgentExecutionResult> => {
    return agentService.execute(id, payload);
  },
};

export default agentPageService;

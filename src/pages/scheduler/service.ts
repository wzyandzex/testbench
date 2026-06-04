import { agentService } from '@/services/agent';
import { benchmarkService } from '@/services/benchmark';
import { request } from '@/services/request';
import { schedulerService } from '@/services/scheduler';
import type { Agent } from '@/types/api/agent';
import type { Benchmark } from '@/types/api/benchmark';
import type {
  CreateScheduledTaskRequest,
  ScheduledTask,
  ScheduledTaskDetail,
  ScheduledTaskListResponse,
  ScheduledTaskStatus,
  TaskRunListResponse,
  UpdateScheduledTaskRequest,
} from '@/types/api/scheduled-task';

const RESOURCE_PAGE_SIZE = 100;

export interface SchedulerResourceOption {
  id: string;
  name: string;
  description?: string;
  meta?: string;
}

export interface SchedulerNotificationChannelOption {
  type: string;
  healthy: boolean;
}

interface NotifierChannelsPayload {
  channels?: Array<{
    type: string;
    enabled: boolean;
    healthy?: boolean;
  }>;
}

async function listAllPages<T>(
  fetchPage: (page: number) => Promise<{ total: number; data: T[] }>
): Promise<T[]> {
  const items: T[] = [];
  let total = 0;
  let page = 1;

  do {
    const current = await fetchPage(page);
    items.push(...current.data);
    total = current.total;
    page += 1;

    if (current.data.length === 0) {
      break;
    }
  } while (items.length < total);

  return items;
}

async function listAgents(): Promise<SchedulerResourceOption[]> {
  const agents = await listAllPages<Agent>(async (page) => {
    const response = (await agentService.list({
      page,
      page_size: RESOURCE_PAGE_SIZE,
    })) as unknown as { total: number; data: Agent[] };

    return {
      total: response.total,
      data: response.data,
    };
  });

  return agents
    .filter((agent) => agent.status === 'active')
    .map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      meta: agent.type,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'));
}

async function listBenchmarks(): Promise<SchedulerResourceOption[]> {
  const benchmarks = await listAllPages<Benchmark>(async (page) => {
    const response = (await benchmarkService.list({
      page,
      page_size: RESOURCE_PAGE_SIZE,
    })) as unknown as { total: number; data: Benchmark[] };

    return {
      total: response.total,
      data: response.data,
    };
  });

  return benchmarks
    .filter((benchmark) => benchmark.status === 'active')
    .map((benchmark) => ({
      id: benchmark.id,
      name: benchmark.display_name || benchmark.name,
      description: benchmark.description,
      meta:
        benchmark.approval_status && benchmark.approval_status !== 'approved'
          ? `\u5f85\u5ba1: ${benchmark.approval_status}`
          : benchmark.language || benchmark.type,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'));
}

async function listNotificationChannels(): Promise<SchedulerNotificationChannelOption[]> {
  try {
    const response = await request.get<NotifierChannelsPayload>('/notifier/channels', {
      silentError: true,
    });

    return (response.channels ?? [])
      .filter((channel) => channel.enabled && channel.type !== 'websocket')
      .map((channel) => ({
        type: channel.type,
        healthy: channel.healthy !== false,
      }))
      .sort((left, right) => left.type.localeCompare(right.type, 'en'));
  } catch {
    return [];
  }
}

export const schedulerPageService = {
  getList(params: {
    page?: number;
    page_size?: number;
    enabled?: boolean;
    status?: ScheduledTaskStatus;
  }): Promise<ScheduledTaskListResponse> {
    return schedulerService.getList(params);
  },

  getDetail(id: string): Promise<ScheduledTaskDetail> {
    return schedulerService.getDetail(id);
  },

  create(data: CreateScheduledTaskRequest): Promise<ScheduledTask> {
    return schedulerService.create(data);
  },

  update(id: string, data: UpdateScheduledTaskRequest): Promise<void> {
    return schedulerService.update(id, data);
  },

  delete(id: string): Promise<void> {
    return schedulerService.delete(id);
  },

  setEnabled(id: string, enabled: boolean): Promise<void> {
    return schedulerService.setEnabled(id, enabled);
  },

  trigger(id: string) {
    return schedulerService.trigger(id);
  },

  getRuns(id: string, params?: { page?: number; page_size?: number }): Promise<TaskRunListResponse> {
    return schedulerService.getRuns(id, params);
  },

  async getCatalog() {
    const [agents, benchmarks, notificationChannels] = await Promise.allSettled([
      listAgents(),
      listBenchmarks(),
      listNotificationChannels(),
    ]);

    return {
      agents: agents.status === 'fulfilled' ? agents.value : [],
      benchmarks: benchmarks.status === 'fulfilled' ? benchmarks.value : [],
      notificationChannels:
        notificationChannels.status === 'fulfilled' ? notificationChannels.value : [],
    };
  },
};

export default schedulerPageService;

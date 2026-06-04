// 系统操作 admin API client
//   POST /api/v1/metrics/aggregated?period=&start_date=&end_date=  (admin only)
//   POST /api/v1/languages/:name/reload                            (admin only)
import api from '@/services/api';

export type AggregationPeriod = 'daily' | 'weekly' | 'monthly';

export interface TriggerAggregationParams {
  period?: AggregationPeriod;
  /** ISO date string, e.g. 2026-05-25T00:00:00Z；省略=今天 00:00 UTC */
  start_date?: string;
  /** ISO date string；省略=当前时间 */
  end_date?: string;
}

export const systemOpsService = {
  /**
   * 手动触发指标聚合任务
   * - 默认 period=daily
   * - start/end 省略时后端默认聚合"今天"
   */
  triggerMetricsAggregation: async (params: TriggerAggregationParams = {}): Promise<unknown> => {
    const usp = new URLSearchParams();
    if (params.period) usp.append('period', params.period);
    if (params.start_date) usp.append('start_date', params.start_date);
    if (params.end_date) usp.append('end_date', params.end_date);
    const qs = usp.toString();
    return api.post(`/metrics/aggregated${qs ? '?' + qs : ''}`);
  },

  /**
   * 重新加载某个语言的配置（如 python/go/java/...）
   * 用于热更新 docker 镜像、执行命令等配置而无需重启服务
   */
  reloadLanguageConfig: async (name: string): Promise<unknown> => {
    return api.post(`/languages/${encodeURIComponent(name)}/reload`);
  },
};

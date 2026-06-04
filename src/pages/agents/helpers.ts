import i18next from 'i18next';
import type { TagProps } from 'antd';
import type {
  Agent,
  AgentModelConfig,
  AgentStatus,
  AgentToolProfile,
  AgentType,
  CreateAgentDto,
  UpdateAgentDto,
} from '@/types/api/agent';

const t = (key: string) => i18next.t(`agents:${key}`);

export const AGENT_TYPE_LABELS: Record<AgentType, string> = {
  get code_edit() { return t('capabilities.codeEdit'); },
  get terminal() { return t('capabilities.terminal'); },
  get hybrid() { return t('capabilities.hybrid'); },
  get autonomous() { return t('capabilities.autonomous'); },
};

export const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  get active() { return t('status.active'); },
  get inactive() { return t('status.inactive'); },
  get maintained() { return t('status.maintained'); },
  get deprecated() { return t('status.deprecated'); },
};

export const AGENT_STATUS_COLORS: Record<AgentStatus, TagProps['color']> = {
  active: 'success',
  inactive: 'default',
  maintained: 'processing',
  deprecated: 'warning',
};

export const AGENT_TYPE_OPTIONS = (['code_edit', 'terminal', 'hybrid', 'autonomous'] as AgentType[]).map((value) => ({
  get label() { return AGENT_TYPE_LABELS[value]; },
  value,
}));

export const AGENT_STATUS_OPTIONS = (['active', 'inactive', 'maintained', 'deprecated'] as AgentStatus[]).map((value) => ({
  get label() { return AGENT_STATUS_LABELS[value]; },
  value,
}));

export const RUNTIME_MODE_OPTIONS = [
  { label: 'Native', value: 'native' },
  { label: 'ADK', value: 'adk' },
] as const;

export const TOOL_PROFILE_OPTIONS: Array<{ label: string; value: AgentToolProfile }> = [
  { get label() { return t('toolProfile.default'); }, value: 'default' },
  { get label() { return t('toolProfile.readonly'); }, value: 'readonly' },
  { get label() { return t('toolProfile.workspaceEditor'); }, value: 'workspace_editor' },
  { get label() { return t('toolProfile.workspaceRepair'); }, value: 'workspace_repair' },
  { get label() { return t('toolProfile.testRunner'); }, value: 'test_runner' },
];

export function getAgentTitle(agent: Pick<Agent, 'name' | 'display_name'>) {
  return agent.display_name?.trim() || agent.name;
}

export function getAgentSubtitle(agent: Pick<Agent, 'name' | 'display_name'>) {
  if (!agent.display_name?.trim() || agent.display_name.trim() === agent.name) {
    return '';
  }
  return agent.name;
}

export function stringifyJSON(value: unknown) {
  if (value === undefined || value === null) {
    return '';
  }
  return JSON.stringify(value, null, 2);
}

export function parseJSONObject(value: string | undefined, fieldLabel: string) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      throw new Error(`${fieldLabel} must be a JSON object`);
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    const reason = error instanceof Error ? error.message : `Cannot parse ${fieldLabel}`;
    throw new Error(reason);
  }
}

export function normalizeTags(values?: string[]) {
  return (values ?? [])
    .map((value) => value.trim())
    .filter(Boolean);
}

export function formatSuccessRate(rate?: number) {
  return `${((rate ?? 0) * 100).toFixed(1)}%`;
}

export function formatDurationMs(duration?: number) {
  const value = duration ?? 0;
  if (value >= 60_000) {
    return `${(value / 60_000).toFixed(1)} min`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)} s`;
  }
  return `${Math.round(value)} ms`;
}

export function formatDurationNs(duration?: number) {
  const value = duration ?? 0;
  return formatDurationMs(value / 1_000_000);
}

export function buildAgentPayload(values: {
  name: string;
  display_name?: string;
  description?: string;
  type: AgentType;
  endpoint: string;
  api_key?: string;
  status: AgentStatus;
  version?: string;
  capabilities?: string[];
  provider?: string;
  model_name?: string;
  base_url?: string;
  runtime_mode?: AgentModelConfig['runtime_mode'];
  tool_profile?: AgentModelConfig['tool_profile'];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
  model_params_json?: string;
  tools_json?: string;
  metadata_json?: string;
}): CreateAgentDto {
  const modelConfig: AgentModelConfig = {};

  if (values.provider?.trim()) {
    modelConfig.provider = values.provider.trim();
  }
  if (values.model_name?.trim()) {
    modelConfig.model_name = values.model_name.trim();
  }
  if (values.base_url?.trim()) {
    modelConfig.base_url = values.base_url.trim();
  }
  if (values.runtime_mode) {
    modelConfig.runtime_mode = values.runtime_mode;
  }
  if (values.tool_profile) {
    modelConfig.tool_profile = values.tool_profile;
  }
  if (typeof values.temperature === 'number') {
    modelConfig.temperature = values.temperature;
  }
  if (typeof values.max_tokens === 'number') {
    modelConfig.max_tokens = values.max_tokens;
  }
  if (typeof values.top_p === 'number') {
    modelConfig.top_p = values.top_p;
  }
  if (typeof values.top_k === 'number') {
    modelConfig.top_k = values.top_k;
  }

  const params = parseJSONObject(values.model_params_json, 'Model Params');
  if (params) {
    modelConfig.params = params;
  }

  return {
    name: values.name.trim(),
    display_name: values.display_name?.trim() || undefined,
    description: values.description?.trim() || undefined,
    type: values.type,
    endpoint: values.endpoint.trim(),
    api_key: values.api_key?.trim() || undefined,
    model_config: Object.keys(modelConfig).length > 0 ? modelConfig : undefined,
    capabilities: normalizeTags(values.capabilities),
    tools: parseJSONObject(values.tools_json, 'Tools'),
    status: values.status,
    version: values.version?.trim() || undefined,
    metadata: parseJSONObject(values.metadata_json, 'Metadata'),
  };
}

export function buildAgentUpdatePayload(values: Parameters<typeof buildAgentPayload>[0]): UpdateAgentDto {
  return buildAgentPayload(values);
}

/**
 * 评测任务状态
 */
export enum BenchmarkStatus {
  Draft = 'draft',
  Active = 'active',
  Archived = 'archived',
  Deprecated = 'deprecated',
}

/**
 * 执行状态
 */
export enum ExecutionStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

/**
 * Agent 类型
 */
export enum AgentType {
  LLM = 'llm',
  Code = 'code',
  Workflow = 'workflow',
}

/**
 * Agent 状态
 */
export enum AgentStatus {
  Active = 'active',
  Inactive = 'inactive',
  Error = 'error',
}

/**
 * 用户角色
 */
export enum UserRole {
  Admin = 'admin',
  User = 'user',
  Viewer = 'viewer',
}

/**
 * 语言
 */
export enum Language {
  ZhCN = 'zh-CN',
  EnUS = 'en-US',
}

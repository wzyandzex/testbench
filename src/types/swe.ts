/**
 * SWE-bench 类型定义
 * 参考: docs/item/04-swe/README.md
 */

import type { Agent } from './agent';

/**
 * SWE 任务状态
 */
export type SWETaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * SWE 任务阶段
 */
export type SWETaskPhase =
  | 'idle'
  | 'cloning'
  | 'setup'
  | 'analyzing'
  | 'fixing'
  | 'testing'
  | 'verifying'
  | 'completed'
  | 'failed';

/**
 * 测试策略
 */
export type TestStrategy = 'full' | 'smart' | 'skip';

/**
 * SWE 任务
 */
export interface SWEBenchTask {
  id: string;
  organizationId: string;
  repoUrl: string;
  repoName: string;
  issueNumber: number;
  issueTitle: string;
  issueBody?: string;
  baseCommit?: string;
  status: SWETaskStatus;
  currentPhase: SWETaskPhase;
  progress: number; // 0-100

  // 配置
  agentId: string;
  agent?: Agent;
  testStrategy: TestStrategy;
  maxRetries: number;
  autoFix: boolean;

  // 执行信息
  startedAt?: Date;
  completedAt?: Date;
  duration?: number; // seconds
  error?: string;

  // 测试结果
  testResult?: SWETestResult;

  // 修复历史
  fixAttempts: number;
  fixHistory?: SWEFixAttempt[];

  // 元数据
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

/**
 * 创建 SWE 任务请求
 */
export interface CreateSWETaskRequest {
  repoUrl: string;
  issueNumber: number;
  issueTitle?: string;
  issueBody?: string;
  baseCommit?: string;
  agentId: string;
  testStrategy?: TestStrategy;
  maxRetries?: number;
  autoFix?: boolean;
}

/**
 * SWE 任务筛选条件
 */
export interface SWETaskFilters {
  search?: string;
  status?: SWETaskStatus[];
  repoName?: string;
  agentId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'progress';
  sortOrder?: 'asc' | 'desc';
}

/**
 * SWE 仓库缓存
 */
export interface SWEBenchRepo {
  name: string;
  url: string;
  cachedAt: Date;
  size: number; // bytes
  commitCount?: number;
  status: 'cached' | 'updating' | 'error';
}

/**
 * SWE 任务日志
 */
export interface SWETaskLog {
  id: string;
  taskId: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  phase: SWETaskPhase;
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * 测试结果
 */
export interface SWETestResult {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  passRate: number; // 0-100
  duration: number; // seconds

  // 失败测试详情
  failedTestCases?: SWETestCase[];

  // 覆盖率
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

/**
 * 测试用例
 */
export interface SWETestCase {
  name: string;
  file: string;
  line: number;
  error?: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
}

/**
 * 修复尝试
 */
export interface SWEFixAttempt {
  attemptNumber: number;
  phase: SWETaskPhase;
  startedAt: Date;
  completedAt?: Date;
  success: boolean;
  changes?: {
    filesModified: string[];
    linesAdded: number;
    linesDeleted: number;
  };
  error?: string;
}

/**
 * SWE 缓存统计
 */
export interface SWECacheStats {
  totalRepos: number;
  totalSize: number;
  lastUpdated: Date;
  repos: SWEBenchRepo[];
}

/**
 * WebSocket 消息类型
 */
export type SWEWSMessageType =
  | 'task.progress'
  | 'task.phase'
  | 'task.log'
  | 'task.completed'
  | 'task.failed'
  | 'cache.updated';

/**
 * WebSocket 消息
 */
export interface SWEWSMessage {
  type: SWEWSMessageType;
  taskId?: string;
  data: unknown;
  timestamp: Date;
}

/**
 * WebSocket 进度消息
 */
export interface SWEWSProgressMessage {
  taskId: string;
  phase: SWETaskPhase;
  progress: number;
  message?: string;
}

/**
 * 任务进度数据
 */
export interface SWETaskProgressData {
  taskId: string;
  phase: SWETaskPhase;
  progress: number;
  message?: string;
}

/**
 * 阶段变更数据
 */
export interface SWEPhaseData {
  taskId: string;
  fromPhase: SWETaskPhase;
  toPhase: SWETaskPhase;
  message?: string;
}

/**
 * 日志数据
 */
export interface SWELogData {
  taskId: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  phase: SWETaskPhase;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * 导出结果
 */
export interface SWEExportResult {
  taskId: string;
  downloadUrl: string;
  fileName: string;
  size: number;
  exportedAt: Date;
}

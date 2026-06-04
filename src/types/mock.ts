/**
 * Mock 数据类型定义
 * 用于开发阶段的模拟数据结构
 */

// ========== Dashboard Mock Types ==========
export interface MockDashboardStats {
  totalBenchmarks: number;
  runningExecutions: number;
  totalAgents: number;
  successRate: number;
  benchmarksChange: number;
  executionsChange: number;
  agentsChange: number;
  successRateChange: number;
}

export interface MockTrendData {
  dates: string[];
  executions: number[];
  successRate: number[];
}

export interface MockRecentExecution {
  id: string;
  taskName: string;
  agent: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  progress: number;
  duration: string;
  startTime: Date;
}

// ========== Benchmark Mock Types ==========
export interface MockBenchmark {
  id: string;
  name: string;
  description: string;
  language: string;
  category: 'coding' | 'reasoning' | 'knowledge';
  status: 'active' | 'draft' | 'archived';
  totalExecutions: number;
  successRate: number;
  lastExecution: Date | null;
}

// ========== Execution Mock Types ==========
export interface MockExecution {
  id: string;
  taskName: string;
  agent: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  progress: number;
  duration: string;
  startTime: Date;
}

// ========== Agent Mock Types ==========
export interface MockAgent {
  id: string;
  name: string;
  description: string;
  type: 'openai' | 'anthropic' | 'google' | 'custom';
  model: string;
  status: 'active' | 'inactive';
  totalExecutions: number;
  avgScore: number;
}

// ========== Organization Mock Types ==========
export interface MockOrganization {
  id: string;
  name: string;
  slug: string;
  description: string;
  owner: string;
  members: number;
  maxMembers: number;
  agents: number;
  benchmarks: number;
  executions: number;
  successRate: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  plan: 'enterprise' | 'professional' | 'team' | 'free';
}

export interface MockMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  avatar: string;
  lastActive: Date;
  contributions: number;
}

export interface MockActivityLog {
  id: string;
  action: string;
  user: string;
  target: string;
  time: Date;
  type: 'create' | 'update' | 'execute' | 'invite' | 'delete';
}

// ========== Scheduler Mock Types ==========
export interface MockSchedule {
  id: string;
  name: string;
  description: string;
  cronExpression: string;
  enabled: boolean;
  status: 'active' | 'paused' | 'failed';
  lastRun: Date | null;
  nextRun: Date | null;
  totalRuns: number;
  successRate: number;
  agents: string[];
  benchmarks: string[];
  createdBy: string;
  createdAt: Date;
  failureReason?: string;
}

// ========== Batch Mock Types ==========
export interface MockBatchTask {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  totalExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  createdAt: Date;
  createdBy: string;
}

// ========== Metrics Mock Types ==========
export interface MockMetricsOverview {
  totalExecutions: number;
  successRate: number;
  avgDuration: number;
  topAgents: { name: string; executions: number; successRate: number }[];
  topBenchmarks: { name: string; executions: number; avgScore: number }[];
}

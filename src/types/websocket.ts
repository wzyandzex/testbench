/**
 * WebSocket 类型定义
 * 参考: front/04-patterns/websocket.md, front/05-types/api-types.md
 */

export type WSMessageType =
  | 'connected'
  | 'subscribed'
  | 'unsubscribed'
  | 'notification'
  | 'execution_progress'
  | 'execution_log'
  | 'execution_completed'
  | 'execution_failed'
  | 'batch_progress'
  | 'batch_status_change'
  | 'batch_completed'
  | 'batch_failed'
  | 'benchmark_update'
  | 'swe_progress'
  | 'ping'
  | 'pong'
  | 'error';

// WebSocket 消息
export interface WSMessage<T = any> {
  event: WSMessageType;
  data: T;
  timestamp?: number;
  subscription_id?: string;
}

// 连接状态
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

// 订阅过滤器
export interface SubscribeFilters {
  local_key?: string;
  user_id?: string;
  organization_id?: string;
  execution_id?: string;
  batch_id?: string;
  benchmark_id?: string;
  event_types?: string[];
}

// 通知数据
export interface NotificationData {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  link?: string;
  created_at: string;
  read: boolean;
}

// 执行进度数据
export interface ExecutionProgressData {
  execution_id: string;
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';
  progress: number;
  current_step: number;
  total_steps: number;
  message: string;
  started_at: string;
  updated_at: string;
}

// 执行日志数据
export interface ExecutionLogData {
  execution_id: string;
  log_id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// 执行完成数据
export interface ExecutionCompletedData {
  execution_id: string;
  result: {
    success: boolean;
    exit_code: number;
    output: string;
    error?: string;
    duration_ms: number;
    tokens_used: number;
    cost: number;
  };
  completed_at: string;
}

// 执行失败数据
export interface ExecutionFailedData {
  execution_id: string;
  error: string;
  failed_at: string;
}

// 批量进度数据
export interface BatchProgressData {
  batch_id: string;
  task_id?: string;
  agent_id?: string;
  benchmark_id?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  completed_count: number;
  total_count: number;
  percentage: number;
  timestamp: number;
}

// 批量状态变更数据
export interface BatchStatusChangeData {
  batch_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  timestamp: number;
}

// 批量完成数据
export interface BatchCompletedData {
  batch_id: string;
  report_id: string;
  timestamp: number;
}

// 批量失败数据
export interface BatchFailedData {
  batch_id: string;
  error: string;
  timestamp: number;
}

// SWE 进度数据
export interface SWEProgressData {
  task_id: string;
  repo_url: string;
  status: string;
  progress: number;
  message: string;
  timestamp: number;
}

// 订阅请求
export interface SubscribeRequest {
  event: 'subscribe';
  filters: SubscribeFilters;
  subscription_id?: string;
}

// 取消订阅请求
export interface UnsubscribeRequest {
  event: 'unsubscribe';
  subscription_id: string;
}

// 消息回调类型
export type MessageCallback = (message: WSMessage) => void;

// WebSocket 配置
export interface WebSocketConfig {
  url: string;
  token?: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
}

// WebSocket 存储状态
export interface WSStoreState {
  socket: WebSocket | null;
  connectionState: ConnectionState;
  clientId: string | null;
  subscriptions: Set<string>;
  connect: () => void;
  disconnect: () => void;
  subscribe: (filters: SubscribeFilters, callback: MessageCallback) => () => void;
  send: (message: any) => void;
}

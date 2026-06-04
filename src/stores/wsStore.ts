/**
 * WebSocket 状态管理
 * 参考: front/04-patterns/websocket.md
 * 遵循 vercel-react-best-practices: rerender-derived-state
 */

import { create } from 'zustand';
import type {
  WSMessage,
  MessageCallback,
  SubscribeFilters,
  WSStoreState as BaseWSStoreState,
} from '@/types';
import { runtimeConfig } from '@/constants/runtime';
import { useAuthStore } from './authStore';

// 扩展 WSStoreState 以包含遗留属性
interface WSStoreState extends BaseWSStoreState {
  // 遗留属性
  messages: any[];
  taskStates: Map<string, any>;
  setConnectionState: (state: any) => void;
  addMessage: (message: any) => void;
  clearMessages: () => void;
  subscribeChannel: (channel: string) => void;
  unsubscribeChannel: (channel: string) => void;
  isSubscribed: (channel: string) => boolean;
  updateTaskState: (taskId: string, state: any) => void;
  getTaskState: (taskId: string) => any;
}

// 消息回调存储
const messageCallbacks = new Map<string, MessageCallback>();

// 生成唯一 ID
const generateId = () => `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 重连管理器
class ReconnectManager {
  private retryCount = 0;
  private baseDelay = 1000;
  private maxDelay = 30000;

  getNextDelay(): number {
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.retryCount),
      this.maxDelay
    );
    this.retryCount++;
    return delay;
  }

  reset(): void {
    this.retryCount = 0;
  }
}

const reconnectManager = new ReconnectManager();
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let manuallyDisconnected = false;

function getAccessToken() {
  return useAuthStore.getState().accessToken;
}

function clearReconnectTimeout() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
}

function isDisconnectedState(state: Pick<WSStoreState, 'socket' | 'connectionState'>) {
  return !state.socket && state.connectionState === 'disconnected';
}

function buildNotifierWebSocketUrl(token: string) {
  const url = new URL(runtimeConfig.notifierWebSocketBaseUrl);
  url.searchParams.set('token', token);
  return url.toString();
}

// 心跳管理器
class HeartbeatManager {
  private interval: ReturnType<typeof setInterval> | null = null;
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private heartbeatInterval = 30000; // 30 秒
  private heartbeatTimeout = 45000; // 45 秒

  start(
    ws: WebSocket,
    onPing: () => void,
    onTimeout: () => void
  ): void {
    this.stop();

    // 定期发送 ping
    this.interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        onPing();

        // 设置超时检测
        this.timeout = setTimeout(onTimeout, this.heartbeatTimeout);
      }
    }, this.heartbeatInterval);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }

  onPong(): void {
    // 收到 pong，清除超时
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}

const heartbeatManager = new HeartbeatManager();

/**
 * Normalize backend notifier messages into the frontend WSMessage format.
 * Backend sends: { type: "task.started", data: { task_id, ... }, ... }
 * Frontend expects: { event: "execution_progress", data: { execution_id, ... }, ... }
 */
function normalizeBackendMessage(raw: any): WSMessage | null {
  if (raw.event) return raw as WSMessage;
  if (!raw.type) return null;

  const backendType: string = raw.type;
  const data = { ...(raw.data || {}) };
  const ts = raw.timestamp ? Date.now() : undefined;

  // Map task_id → execution_id for execution events
  if (data.task_id && !data.execution_id) {
    data.execution_id = data.task_id;
  }

  switch (backendType) {
    case 'task.created':
    case 'task.started':
      return { event: 'execution_progress', data: { ...data, status: backendType === 'task.created' ? 'queued' : 'running' }, timestamp: ts };
    case 'task.completed':
      return { event: 'execution_completed', data, timestamp: ts };
    case 'task.failed':
      return { event: 'execution_failed', data: { ...data, error: data.error || raw.message }, timestamp: ts };
    case 'task.cancelled':
      return { event: 'execution_failed', data: { ...data, error: 'cancelled', cancelled: true }, timestamp: ts };
    case 'agent.call_start':
    case 'agent.call_end':
    case 'agent.error':
    case 'test.start':
    case 'test.end':
    case 'test.error':
    case 'sandbox.error':
      return { event: 'execution_log', data: { ...data, level: backendType.endsWith('error') ? 'error' : 'info', message: raw.message || backendType }, timestamp: ts };
    case 'batch.created':
    case 'batch.started':
    case 'batch.progress':
      return { event: 'batch_progress', data, timestamp: ts };
    case 'batch.completed':
      return { event: 'batch_completed', data, timestamp: ts };
    case 'batch.failed':
    case 'batch.cancelled':
      return { event: 'batch_failed', data: { ...data, error: data.error || raw.message }, timestamp: ts };
    case 'benchmark.created':
    case 'benchmark.updated':
    case 'benchmark.forked':
    case 'benchmark.approved':
    case 'benchmark.rejected':
    case 'benchmark.parent_update':
      return { event: 'benchmark_update', data: { ...data, action: backendType.split('.')[1] }, timestamp: ts };
    default:
      return { event: 'notification' as any, data: { ...data, type: backendType, message: raw.message }, timestamp: ts };
  }
}

/**
 * 消息处理
 */
function handleMessage(message: WSMessage): void {
  switch (message.event) {
    case 'pong':
      heartbeatManager.onPong();
      break;

    case 'notification':
      notifySubscribers('notification', message);
      notifySubscribers('__global__', message);
      break;

    case 'execution_progress':
    case 'execution_log':
    case 'execution_completed':
    case 'execution_failed':
      // 分发到订阅特定执行的回调
      const execId = message.data.execution_id;
      if (execId) {
        notifySubscribers(execId, message);
      }
      if (message.event === 'execution_completed' || message.event === 'execution_failed') {
        notifySubscribers('__global__', message);
      }
      break;

    case 'batch_progress':
    case 'batch_completed':
    case 'batch_failed':
      // 分发到订阅特定批量的回调
      const batchId = message.data.batch_id;
      if (batchId) {
        notifySubscribers(batchId, message);
      }
      if (message.event === 'batch_completed' || message.event === 'batch_failed') {
        notifySubscribers('__global__', message);
      }
      break;

    case 'benchmark_update': {
      const benchmarkId = message.data.benchmark_id;
      if (benchmarkId) {
        notifySubscribers(`benchmark:${benchmarkId}`, message);
      }
      notifySubscribers('__global__', message);
      break;
    }

    default:
      break;
  }
}

/**
 * 通知订阅者
 */
function notifySubscribers(key: string, message: WSMessage): void {
  messageCallbacks.forEach((callback, subscriptionId) => {
    if (subscriptionId.startsWith(key)) {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in WebSocket callback:', error);
      }
    }
  });
}

function buildServerFilters(filters: SubscribeFilters): SubscribeFilters {
  const { local_key: _localKey, ...serverFilters } = filters;
  return serverFilters;
}

// 兼容旧版接口类型定义
export type LegacyConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface LegacyWsMessage {
  type: string;
  data: any;
  timestamp: number;
}

/**
 * WebSocket Store
 * 完整实现 + 兼容旧版接口
 */
export const useWSStore = create<WSStoreState>((set, get) => ({
  // 核心属性
  socket: null,
  clientId: null,
  connectionState: 'disconnected' as any,
  messages: [] as any[],
  subscriptions: new Set<string>(),
  taskStates: new Map<any, any>(),

  // 旧版兼容方法
  setConnectionState: (state: any) => set({ connectionState: state }),
  addMessage: (message: any) =>
    set((state) => ({
      messages: [...(state.messages as any[]), { ...message, timestamp: Date.now() }],
    })),
  clearMessages: () => set({ messages: [] }),
  subscribeChannel: (channel: string) =>
    set((state) => {
      const newSubscriptions = new Set(state.subscriptions);
      newSubscriptions.add(channel);
      return { subscriptions: newSubscriptions };
    }),
  unsubscribeChannel: (channel: string) =>
    set((state) => {
      const newSubscriptions = new Set(state.subscriptions);
      newSubscriptions.delete(channel);
      return { subscriptions: newSubscriptions };
    }),
  isSubscribed: (channel: string) => get().subscriptions.has(channel),
  updateTaskState: (taskId: string, taskState: any) =>
    set((storeState) => {
      const newTaskStates = new Map(storeState.taskStates as Map<string, any>);
      newTaskStates.set(taskId, { ...newTaskStates.get(taskId), ...taskState });
      return { taskStates: newTaskStates };
    }),
  getTaskState: (taskId: string) => (get().taskStates as Map<string, any>).get(taskId),

  // 核心方法
  connect: () => {
    const { socket, connectionState } = get();
    const token = getAccessToken();

    // 如果已经连接或正在连接，不重复连接
    if (
      socket?.readyState === WebSocket.OPEN ||
      connectionState === 'connecting' ||
      connectionState === 'connected'
    ) {
      return;
    }

    if (!token) {
      if (connectionState !== 'disconnected') {
        set({ connectionState: 'disconnected' as any });
      }
      return;
    }

    manuallyDisconnected = false;
    clearReconnectTimeout();
    set({ connectionState: 'connecting' as any });

    try {
      const ws = new WebSocket(buildNotifierWebSocketUrl(token));

      ws.onopen = () => {
        if (get().socket !== ws) {
          ws.close();
          return;
        }

        reconnectManager.reset();
        set({ connectionState: 'connected' as any });

        heartbeatManager.stop();
      };

      ws.onmessage = (event) => {
        if (get().socket !== ws) {
          return;
        }

        try {
          const raw = JSON.parse(event.data);
          const message = normalizeBackendMessage(raw);
          if (message) handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        const currentSocket = get().socket;
        if (currentSocket !== ws) {
          return;
        }

        heartbeatManager.stop();
        set({ socket: null, connectionState: 'disconnected' as any });

        if (manuallyDisconnected || !getAccessToken()) {
          return;
        }

        // 触发重连
        const delay = reconnectManager.getNextDelay();
        if (delay > 0) {
          clearReconnectTimeout();
          reconnectTimeout = setTimeout(() => {
            reconnectTimeout = null;
            get().connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        if (get().socket !== ws) {
          return;
        }

        console.error('WebSocket error:', error);
        set({ connectionState: 'error' as any });
      };

      set({ socket: ws });
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      set({ connectionState: 'error' as any });
    }
  },

  disconnect: () => {
    const { socket, connectionState } = get();
    manuallyDisconnected = true;
    clearReconnectTimeout();
    heartbeatManager.stop();

    if (socket) {
      socket.close();
    }
    if (isDisconnectedState({ socket, connectionState })) {
      return;
    }
    set({ socket: null, connectionState: 'disconnected' as any });
  },

  subscribe: (filters: SubscribeFilters, callback: MessageCallback) => {
    const { socket, connectionState } = get();

    // 确保已连接
    if (connectionState === 'disconnected') {
      get().connect();
    }

    // 生成订阅 ID
    const subscriptionId = generateId();
    const subscriptionKey = filters.local_key || Object.values(filters).filter(Boolean).join(':') || subscriptionId;
    const fullSubscriptionId = `${subscriptionKey}:${subscriptionId}`;
    const serverFilters = buildServerFilters(filters);

    // 注册回调
    messageCallbacks.set(fullSubscriptionId, callback);

    // 如果已连接，发送订阅请求
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        action: 'subscribe',
        event: 'subscribe',
        filters: serverFilters,
        subscription_id: fullSubscriptionId,
      }));
    }

    // 更新订阅集合
    set((state) => ({
      subscriptions: new Set(state.subscriptions).add(fullSubscriptionId),
    }));

    // 返回取消订阅函数
    return () => {
      if (!messageCallbacks.has(fullSubscriptionId)) {
        return;
      }

      const { socket: currentSocket } = get();

      // 发送取消订阅请求
      if (currentSocket?.readyState === WebSocket.OPEN) {
        currentSocket.send(JSON.stringify({
          action: 'unsubscribe',
          event: 'unsubscribe',
          subscription_id: fullSubscriptionId,
        }));
      }

      // 移除回调
      messageCallbacks.delete(fullSubscriptionId);

      // 更新订阅集合
      set((state) => {
        if (!state.subscriptions.has(fullSubscriptionId)) {
          return state;
        }
        const newSubscriptions = new Set(state.subscriptions);
        newSubscriptions.delete(fullSubscriptionId);
        return { subscriptions: newSubscriptions };
      });
    };
  },

  send: (message: any) => {
    const { socket } = get();
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent:', message);
    }
  },
}));

// 为了兼容性，添加别名
export const useWsStore = useWSStore;

export default useWSStore;

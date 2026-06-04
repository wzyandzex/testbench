# WebSocket 连接管理器设计

## 概述

WebSocket 连接管理器负责管理与后端 Notifier 服务的 WebSocket 连接，提供连接管理、消息订阅、断线重连等功能。

## 连接管理器类设计

### 基础实现

```typescript
// src/services/websocket.ts
type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

type MessageHandler = (data: any) => void;
type ConnectionHandler = (state: ConnectionState) => void;

interface WebSocketManagerOptions {
  url: string;
  token: string | null;
  heartbeatInterval?: number;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface SubscribeOptions {
  channel: string;
  handler: MessageHandler;
  once?: boolean;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string | null;
  private state: ConnectionState = 'disconnected';
  private heartbeatInterval: number;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private reconnectAttempts = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  // 订阅管理
  private subscriptions = new Map<string, Set<MessageHandler>>();
  private onceSubscriptions = new Map<string, Set<MessageHandler>>();

  // 事件监听器
  private stateListeners = new Set<ConnectionHandler>();
  private messageListeners = new Set<MessageHandler>();

  constructor(options: WebSocketManagerOptions) {
    this.url = options.url;
    this.token = options.token;
    this.heartbeatInterval = options.heartbeatInterval || 30000;
    this.reconnectInterval = options.reconnectInterval || 3000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
  }

  // 连接
  connect(): void {
    if (this.state === 'connected' || this.state === 'connecting') {
      return;
    }

    this.setState('connecting');

    try {
      const wsUrl = this.token ? `${this.url}?token=${this.token}` : this.url;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (error) {
      this.setState('error');
      this.scheduleReconnect();
    }
  }

  // 断开连接
  disconnect(): void {
    this.clearHeartbeat();
    this.clearReconnect();

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }

    this.setState('disconnected');
  }

  // 更新 Token
  updateToken(token: string): void {
    this.token = token;
    if (this.state === 'connected') {
      // 重新连接以使用新 Token
      this.disconnect();
      this.connect();
    }
  }

  // 订阅频道
  subscribe(channel: string, handler: MessageHandler): () => void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    this.subscriptions.get(channel)!.add(handler);

    // 发送订阅消息
    this.send({ type: 'subscribe', channel });

    // 返回取消订阅函数
    return () => this.unsubscribe(channel, handler);
  }

  // 取消订阅
  unsubscribe(channel: string, handler?: MessageHandler): void {
    if (handler) {
      this.subscriptions.get(channel)?.delete(handler);
      if (this.subscriptions.get(channel)?.size === 0) {
        this.subscriptions.delete(channel);
        this.send({ type: 'unsubscribe', channel });
      }
    } else {
      this.subscriptions.delete(channel);
      this.send({ type: 'unsubscribe', channel });
    }
  }

  // 一次性订阅
  subscribeOnce(channel: string, handler: MessageHandler): void {
    if (!this.onceSubscriptions.has(channel)) {
      this.onceSubscriptions.set(channel, new Set());
    }
    this.onceSubscriptions.get(channel)!.add(handler);
    this.subscribe(channel, handler);
  }

  // 发送消息
  send(data: any): boolean {
    if (this.state !== 'connected' || !this.ws) {
      console.warn('WebSocket not connected');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  // 监听连接状态
  onStateChange(handler: ConnectionHandler): () => void {
    this.stateListeners.add(handler);
    return () => this.stateListeners.delete(handler);
  }

  // 监听所有消息
  onMessage(handler: MessageHandler): () => void {
    this.messageListeners.add(handler);
    return () => this.messageListeners.delete(handler);
  }

  // 获取连接状态
  getState(): ConnectionState {
    return this.state;
  }

  // ==================== 私有方法 ====================

  private setState(state: ConnectionState): void {
    if (this.state !== state) {
      this.state = state;
      this.stateListeners.forEach((handler) => handler(state));
    }
  }

  private handleOpen(): void {
    this.setState('connected');
    this.reconnectAttempts = 0;
    this.startHeartbeat();

    // 重新订阅所有频道
    this.resubscribeAll();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      // 处理心跳响应
      if (data.type === 'pong') {
        return;
      }

      // 通知所有消息监听器
      this.messageListeners.forEach((handler) => handler(data));

      // 通知特定频道订阅者
      if (data.channel) {
        const handlers = this.subscriptions.get(data.channel);
        handlers?.forEach((handler) => {
          handler(data.payload || data);
        });

        // 处理一次性订阅
        const onceHandlers = this.onceSubscriptions.get(data.channel);
        onceHandlers?.forEach((handler) => {
          handler(data.payload || data);
          this.unsubscribe(data.channel, handler);
        });
        this.onceSubscriptions.delete(data.channel);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    this.setState('disconnected');
    this.clearHeartbeat();

    // 如果不是主动关闭，尝试重连
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  private handleError(): void {
    this.setState('error');
  }

  private startHeartbeat(): void {
    this.clearHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, this.heartbeatInterval);
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    this.clearReconnect();
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, this.reconnectInterval * Math.min(this.reconnectAttempts, 5)); // 指数退避
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private resubscribeAll(): void {
    this.subscriptions.forEach((_, channel) => {
      this.send({ type: 'subscribe', channel });
    });
  }
}
```

## React Hook 封装

```typescript
// src/hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';
import { WebSocketManager } from '@/services/websocket';

let wsManager: WebSocketManager | null = null;

export function useWebSocket() {
  const token = useAuthStore((state) => state.accessToken);
  const [state, setState] = useState<ConnectionState>('disconnected');

  // 初始化连接管理器
  useEffect(() => {
    if (!wsManager) {
      wsManager = new WebSocketManager({
        url: import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8005/ws',
        token,
        heartbeatInterval: 30000,
        reconnectInterval: 3000,
        maxReconnectAttempts: 10,
      });
    }

    // 监听连接状态
    const unsubscribe = wsManager.onStateChange(setState);

    return () => {
      unsubscribe();
    };
  }, []);

  // 更新 Token
  useEffect(() => {
    if (wsManager && token) {
      wsManager.updateToken(token);
    }
  }, [token]);

  // 连接
  const connect = useCallback(() => {
    wsManager?.connect();
  }, []);

  // 断开连接
  const disconnect = useCallback(() => {
    wsManager?.disconnect();
  }, []);

  // 订阅
  const subscribe = useCallback((channel: string, handler: MessageHandler) => {
    return wsManager?.subscribe(channel, handler);
  }, []);

  // 发送消息
  const send = useCallback((data: any) => {
    return wsManager?.send(data) ?? false;
  }, []);

  return {
    state,
    connected: state === 'connected',
    connect,
    disconnect,
    subscribe,
    send,
  };
}
```

## 业务 Hook

### 执行状态订阅

```typescript
// src/hooks/useExecutionUpdates.ts
import { useEffect } from 'react';
import { useWebSocket } from './useWebSocket';

export function useExecutionUpdates(executionId: string, onUpdate: (data: any) => void) {
  const { connected, subscribe } = useWebSocket();

  useEffect(() => {
    if (!connected || !executionId) return;

    const unsubscribe = subscribe(`execution:${executionId}`, (data) => {
      onUpdate(data);
    });

    return unsubscribe;
  }, [connected, executionId, subscribe, onUpdate]);
}
```

### 通知订阅

```typescript
// src/hooks/useNotifications.ts
import { useEffect, useState } from 'react';
import { useWebSocket } from './useWebSocket';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
}

export function useNotifications() {
  const { connected, subscribe } = useWebSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!connected) return;

    const unsubscribe = subscribe('notifications', (data) => {
      const notification: Notification = {
        id: data.id,
        type: data.type || 'info',
        title: data.title,
        message: data.message,
        timestamp: data.timestamp,
      };

      setNotifications((prev) => [notification, ...prev]);
      setUnread((prev) => prev + 1);

      // 显示桌面通知
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png',
        });
      }
    });

    return unsubscribe;
  }, [connected, subscribe]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnread((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  return {
    notifications,
    unread,
    markAsRead,
    markAllAsRead,
  };
}
```

### 任务进度订阅

```typescript
// src/hooks/useTaskProgress.ts
import { useState } from 'react';
import { useExecutionUpdates } from './useExecutionUpdates';

export function useTaskProgress(executionId: string) {
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    percentage: 0,
    status: 'pending',
  });

  useExecutionUpdates(executionId, (data) => {
    if (data.type === 'progress') {
      setProgress({
        current: data.current,
        total: data.total,
        percentage: Math.round((data.current / data.total) * 100),
        status: data.status,
      });
    } else if (data.type === 'completed') {
      setProgress((prev) => ({ ...prev, status: 'completed', percentage: 100 }));
    } else if (data.type === 'failed') {
      setProgress((prev) => ({ ...prev, status: 'failed' }));
    }
  });

  return progress;
}
```

## Zustand Store 集成

```typescript
// src/stores/wsStore.ts
import { create } from 'zustand';
import { WebSocketManager } from '@/services/websocket';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

interface WsStore {
  manager: WebSocketManager | null;
  connectionState: ConnectionState;

  initManager: (token: string) => void;
  connect: () => void;
  disconnect: () => void;
  setConnectionState: (state: ConnectionState) => void;
  subscribe: (channel: string, handler: (data: any) => void) => () => void;
  send: (data: any) => boolean;
}

export const useWsStore = create<WsStore>((set, get) => ({
  manager: null,
  connectionState: 'disconnected',

  initManager: (token) => {
    const manager = new WebSocketManager({
      url: import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8005/ws',
      token,
    });

    manager.onStateChange((state) => {
      set({ connectionState: state });
    });

    set({ manager });
  },

  connect: () => {
    get().manager?.connect();
  },

  disconnect: () => {
    get().manager?.disconnect();
  },

  setConnectionState: (state) => {
    set({ connectionState: state });
  },

  subscribe: (channel, handler) => {
    return get().manager?.subscribe(channel, handler) || (() => {});
  },

  send: (data) => {
    return get().manager?.send(data) ?? false;
  },
}));
```

## 连接状态显示组件

```typescript
// src/components/ConnectionStatus.tsx
import { Badge } from 'antd';
import { useWsStore } from '@/stores/wsStore';

const statusConfig = {
  disconnected: { status: 'default', text: '未连接' },
  connecting: { status: 'processing', text: '连接中' },
  connected: { status: 'success', text: '已连接' },
  error: { status: 'error', text: '连接错误' },
};

export function ConnectionStatus() {
  const connectionState = useWsStore((state) => state.connectionState);
  const config = statusConfig[connectionState];

  return (
    <Badge status={config.status as any} text={config.text} />
  );
}
```

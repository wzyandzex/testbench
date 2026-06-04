/**
 * WebSocket Hook
 * 参考: front/04-patterns/websocket.md
 * 遵循 vercel-react-best-practices: client-swr-dedup, rerender-derived-state
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useWSStore } from '@/stores/wsStore';
import type {
  SubscribeFilters,
  WSMessage,
  MessageCallback,
  ConnectionState,
} from '@/types';

interface UseWebSocketOptions {
  enabled?: boolean;
  onMessage?: (message: WSMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

interface UseWebSocketReturn {
  connected: boolean;
  connecting: boolean;
  connectionState: ConnectionState;
  sendMessage: (message: any) => void;
  subscribe: (filters: SubscribeFilters, callback: MessageCallback) => () => void;
}

/**
 * WebSocket Hook
 * 提供 WebSocket 连接和订阅功能
 */
export function useWebSocket(
  options?: UseWebSocketOptions
): UseWebSocketReturn;

/**
 * WebSocket Hook (带订阅)
 * 订阅特定过滤器的事件
 */
export function useWebSocket(
  filters: SubscribeFilters,
  callback: MessageCallback,
  enabled?: boolean
): UseWebSocketReturn;

export function useWebSocket(
  arg1?: SubscribeFilters | UseWebSocketOptions,
  arg2?: MessageCallback | boolean,
  _arg3?: boolean
): UseWebSocketReturn {
  const connectionState = useWSStore((s) => s.connectionState) as ConnectionState;
  const connect = useWSStore((s) => s.connect);
  const storeSubscribe = useWSStore((s) => s.subscribe);
  const send = useWSStore((s) => s.send);

  // 解析参数
  const isObjectArg = typeof arg1 === 'object' && arg1 !== null;
  const isSubscribeMode = isObjectArg && typeof arg2 === 'function';
  const isOptionsMode = isObjectArg && !isSubscribeMode;

  const options: UseWebSocketOptions = isOptionsMode
    ? (arg1 as UseWebSocketOptions)
    : { enabled: true };

  const filters = isSubscribeMode ? (arg1 as SubscribeFilters) : undefined;
  const callback = isSubscribeMode && typeof arg2 === 'function' ? (arg2 as MessageCallback) : undefined;
  const enabled = options.enabled ?? true;

  // 引用存储
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const onConnectRef = useRef(options.onConnect);
  const onDisconnectRef = useRef(options.onDisconnect);
  const onErrorRef = useRef(options.onError);
  const onMessageRef = useRef(options.onMessage);

  // 更新回调引用
  useEffect(() => {
    onConnectRef.current = options.onConnect;
    onDisconnectRef.current = options.onDisconnect;
    onErrorRef.current = options.onError;
    onMessageRef.current = options.onMessage;
  }, [options.onConnect, options.onDisconnect, options.onError, options.onMessage]);

  const connected = connectionState === 'connected';
  const connecting = connectionState === 'connecting';

  // 订阅处理
  useEffect(() => {
    if (!enabled || !isSubscribeMode || !filters || !callback) {
      return;
    }

    // 确保已连接
    if (connectionState === 'disconnected') {
      connect();
    }

    // 使用 subscribe 方法
    unsubscribeRef.current = storeSubscribe?.(filters, callback);

    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, [enabled, isSubscribeMode, filters, callback, connectionState, connect, storeSubscribe]);

  // 监听连接状态变化
  useEffect(() => {
    if (connectionState === 'connected' && onConnectRef.current) {
      onConnectRef.current();
    } else if (connectionState === 'disconnected' && onDisconnectRef.current) {
      onDisconnectRef.current();
    }
  }, [connectionState]);

  // 发送消息
  const sendMessage = useCallback(
    (message: any) => {
      send(message);
    },
    [send]
  );

  // 订阅方法
  const subscribe = useCallback(
    (subFilters: SubscribeFilters, subCallback: MessageCallback) => {
      return storeSubscribe?.(subFilters, subCallback) || (() => {});
    },
    [storeSubscribe]
  );

  return useMemo(
    () => ({
      connected,
      connecting,
      connectionState,
      sendMessage,
      subscribe,
    }),
    [connected, connecting, connectionState, sendMessage, subscribe]
  );
}

/**
 * Hook: 订阅执行进度
 */
export function useExecutionProgress(
  executionId: string,
  callbacks: {
    onProgress?: (progress: number, message: string) => void;
    onLog?: (log: any) => void;
    onCompleted?: (result: any) => void;
    onFailed?: (error: string) => void;
  },
  enabled = true
) {
  const storeSubscribe = useWSStore((s) => s.subscribe);
  const { connected } = useWebSocket();
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!enabled || !connected || !executionId) return;

    const unsubscribe = storeSubscribe?.(
      { execution_id: executionId },
      (message: WSMessage) => {
        switch (message.event) {
          case 'execution_progress':
            callbacksRef.current.onProgress?.(
              message.data.progress,
              message.data.message
            );
            break;
          case 'execution_log':
            callbacksRef.current.onLog?.(message.data);
            break;
          case 'execution_completed':
            callbacksRef.current.onCompleted?.(message.data.result ?? message.data);
            break;
          case 'execution_failed':
            callbacksRef.current.onFailed?.(message.data.error);
            break;
        }
      }
    );

    return unsubscribe;
  }, [executionId, enabled, connected, storeSubscribe]);

  return { connected };
}

/**
 * Hook: 订阅批量进度
 */
export function useBatchProgress(
  batchId: string,
  callbacks: {
    onProgress?: (completed: number, total: number, percentage: number) => void;
    onCompleted?: (reportId: string) => void;
    onFailed?: (error: string) => void;
  },
  enabled = true
) {
  const storeSubscribe = useWSStore((s) => s.subscribe);
  const { connected } = useWebSocket();
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!enabled || !connected || !batchId) return;

    const unsubscribe = storeSubscribe?.(
      { batch_id: batchId },
      (message: WSMessage) => {
        switch (message.event) {
          case 'batch_progress':
            callbacksRef.current.onProgress?.(
              message.data.completed_count,
              message.data.total_count,
              message.data.percentage
            );
            break;
          case 'batch_completed':
            callbacksRef.current.onCompleted?.(message.data.report_id);
            break;
          case 'batch_failed':
            callbacksRef.current.onFailed?.(message.data.error);
            break;
        }
      }
    );

    return unsubscribe;
  }, [batchId, enabled, connected, storeSubscribe]);

  return { connected };
}

/**
 * Hook: 订阅 Benchmark 更新事件
 */
export function useBenchmarkUpdates(
  benchmarkId: string,
  onUpdate: () => void,
  enabled = true
) {
  const storeSubscribe = useWSStore((s) => s.subscribe);
  const { connected } = useWebSocket();
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!enabled || !connected || !benchmarkId) return;

    const unsubscribe = storeSubscribe?.(
      {
        local_key: `benchmark:${benchmarkId}`,
        benchmark_id: benchmarkId,
        event_types: [
          'benchmark.created',
          'benchmark.updated',
          'benchmark.forked',
          'benchmark.approved',
          'benchmark.rejected',
          'benchmark.parent_update',
        ],
      },
      () => { onUpdateRef.current(); }
    );

    return unsubscribe;
  }, [benchmarkId, enabled, connected, storeSubscribe]);

  return { connected };
}

export default useWebSocket;

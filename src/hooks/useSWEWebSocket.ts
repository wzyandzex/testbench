/**
 * SWE-bench WebSocket Hook
 * 用于实时接收 SWE 任务进度更新，带有断线重连指数退避（Exponential backoff）和心跳机制
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '@/stores';
import { useSWEStore } from '@/stores/sweStore';
import { buildApiWebSocketUrl } from '@/constants/runtime';
import type { SWETaskProgressData, SWEPhaseData, SWELogData } from '@/types';

interface UseSWEWebSocketOptions {
  taskId?: string;
  onProgress?: (data: SWETaskProgressData) => void;
  onPhaseChange?: (data: SWEPhaseData) => void;
  onLog?: (data: SWELogData) => void;
  onCompleted?: (taskId: string) => void;
  onFailed?: (taskId: string, error: string) => void;
  enabled?: boolean;
}

/**
 * 构建 WebSocket URL
 */
const buildWsUrl = (taskId?: string, token?: string | null): string => {
  const path = taskId ? `/swenbench/tasks/${taskId}/ws` : '/swenbench/ws';
  const url = new URL(buildApiWebSocketUrl(path));
  if (token) {
    url.searchParams.set('token', token);
  }
  return url.toString();
};

/**
 * SWE WebSocket Hook
 */
export const useSWEWebSocket = (options: UseSWEWebSocketOptions = {}) => {
  const {
    taskId,
    onProgress,
    onPhaseChange,
    onLog,
    onCompleted,
    onFailed,
    enabled = true,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectCountRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 10; // Max reconnects before giving up

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const token = useAuthStore((state) => state.accessToken);
  const updateTaskProgress = useSWEStore((state) => state.updateTaskProgress);

  /**
   * 断开 WebSocket
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      // 1000 = Normal closure
      wsRef.current.close(1000, 'Client disconnected manually');
      wsRef.current = null;
    }

    setConnected(false);
    setConnecting(false);
  }, []);

  /**
   * 建立 WebSocket 连接
   */
  const connect = useCallback(() => {
    if (!token || !enabled) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return;

    setConnecting(true);

    try {
      const url = buildWsUrl(taskId, token);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[SWE WS] Connected:', url);
        setConnected(true);
        setConnecting(false);
        reconnectCountRef.current = 0; // Reset counter on success
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as any;

          switch (data.type) {
            case 'task.progress':
              if (data.data) {
                const progressData = data.data as SWETaskProgressData;
                updateTaskProgress(progressData.taskId, progressData.progress, progressData.phase);
                onProgress?.(progressData);
              }
              break;
            case 'task.phase':
              if (data.data) onPhaseChange?.(data.data as SWEPhaseData);
              break;
            case 'task.log':
              if (data.data) onLog?.(data.data as SWELogData);
              break;
            case 'task.completed':
              if (data.taskId) onCompleted?.(data.taskId);
              break;
            case 'task.failed':
              if (data.taskId && data.data) onFailed?.(data.taskId, data.data.error || 'Unknown error');
              break;
            case 'system.ping':
              // Respond to ping with pong to keep connection alive
              ws.send(JSON.stringify({ type: 'system.pong' }));
              break;
            default:
              break;
          }
        } catch (err) {
          console.error('[SWE WS] Parse message error:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('[SWE WS] Error:', error);
      };

      ws.onclose = (event) => {
        console.log(`[SWE WS] Closed (code: ${event.code}, reason: ${event.reason})`);
        setConnected(false);
        setConnecting(false);
        wsRef.current = null;

        // Exponential backoff reconnect, max 10 attempts
        // Only reconnect if it wasn't a clean close (1000)
        if (event.code !== 1000 && enabled && reconnectCountRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 30000); // Max 30s
          console.log(`[SWE WS] Reconnecting in ${delay}ms (attempt ${reconnectCountRef.current + 1} of ${MAX_RECONNECT_ATTEMPTS})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectCountRef.current += 1;
            connect();
          }, delay);
        } else if (reconnectCountRef.current >= MAX_RECONNECT_ATTEMPTS) {
           console.error('[SWE WS] Max reconnect attempts reached. Giving up.');
        }
      };
    } catch (err) {
      console.error('[SWE WS] Setup error:', err);
      setConnecting(false);
    }
  }, [taskId, token, onProgress, onPhaseChange, onLog, onCompleted, onFailed, updateTaskProgress, enabled]);


  /**
   * 发送消息
   */
  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  // 生命周期管理
  useEffect(() => {
    if (enabled && token) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [enabled, token, taskId, connect, disconnect]);

  return {
    connected,
    connecting,
    send,
    connect,
    disconnect,
  };
};

export default useSWEWebSocket;

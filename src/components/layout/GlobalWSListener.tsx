import { useEffect, useRef } from 'react';
import { message, notification } from 'antd';
import { useTranslation } from 'react-i18next';
import { useWSStore } from '@/stores/wsStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuthStore, useUiStore } from '@/stores';
import type { WSMessage } from '@/types/websocket';

const EVENT_TYPES: Record<string, 'success' | 'error' | 'info'> = {
  execution_completed: 'success',
  execution_failed: 'error',
  batch_completed: 'success',
  batch_failed: 'error',
  benchmark_update: 'info',
  notification: 'info',
};

const EVENT_TITLE_KEYS: Record<string, string> = {
  execution_completed: 'notifications:category.executionCompleted',
  execution_failed: 'notifications:category.executionFailed',
  batch_completed: 'batch:completed',
  batch_failed: 'batch:failed',
  benchmark_update: 'benchmarks:updated',
  notification: 'notifications:title',
};

function getDescription(msg: WSMessage): string {
  const d = msg.data || {};
  if (d.message) return d.message;
  if (d.execution_id) return `ID: ${d.execution_id.slice(0, 8)}...`;
  if (d.batch_id) return `ID: ${d.batch_id.slice(0, 8)}...`;
  if (d.benchmark_id) return `${d.action || 'updated'}`;
  return '';
}

export function GlobalWSListener() {
  const connectionState = useWSStore((s) => s.connectionState);
  const connect = useWSStore((s) => s.connect);
  const disconnect = useWSStore((s) => s.disconnect);
  const subscribe = useWSStore((s) => s.subscribe);
  const connected = connectionState === 'connected';
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setNotificationCount = useUiStore((s) => s.setNotificationCount);
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const mountedRef = useRef(true);
  const wasConnectedRef = useRef(false);
  const activeTokenRef = useRef<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Toast on reconnect / disconnect
  useEffect(() => {
    if (connectionState === 'connected') {
      if (wasConnectedRef.current) {
        message.success(t('common:ws.restored'));
      }
      wasConnectedRef.current = true;
    } else if (connectionState === 'error' && wasConnectedRef.current) {
      message.warning(t('common:ws.reconnecting'));
    }
  }, [connectionState, t]);

  // Auto-connect WS after auth is available; close it when auth is cleared.
  useEffect(() => {
    if (!accessToken) {
      if (activeTokenRef.current) {
        activeTokenRef.current = null;
      }
      disconnect();
      return;
    }

    if (activeTokenRef.current === accessToken) {
      return;
    }

    if (activeTokenRef.current) {
      disconnect();
    }

    activeTokenRef.current = accessToken;
    connect();

    return () => {
      if (activeTokenRef.current === accessToken) {
        activeTokenRef.current = null;
        disconnect();
      }
    };
  }, [accessToken, connect, disconnect]);

  // Fetch notification count on mount
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Sync notificationStore.unreadCount → uiStore badge
  useEffect(() => {
    setNotificationCount(unreadCount);
  }, [unreadCount, setNotificationCount]);

  // Subscribe to global WS events for toasts
  useEffect(() => {
    if (!connected || !currentUserId) return;

    const unsubscribe = subscribe?.(
      {
        local_key: '__global__',
        user_id: currentUserId,
        event_types: ['task.completed', 'task.failed', 'batch.completed', 'batch.failed'],
      },
      (msg: WSMessage) => {
        if (!mountedRef.current) return;

        const type = EVENT_TYPES[msg.event];
        if (!type) return;

        const titleKey = EVENT_TITLE_KEYS[msg.event];
        notification[type]({
          message: t(titleKey),
          description: getDescription(msg),
          duration: 4,
          placement: 'topRight',
        });

        fetchUnreadCount();
      }
    );

    return unsubscribe;
  }, [connected, currentUserId, subscribe, fetchUnreadCount, t]);

  return null;
}

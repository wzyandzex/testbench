import { useCallback, useRef, useState } from 'react';
import type { LogEntry } from '@/pages/batch/components/HolographicLogViewer';
import type { ExecutionLogData } from '@/types/websocket';
import type { ExecutionTrace } from '@/types/api/execution';

const MAX_LOGS = 2000;
const FLUSH_INTERVAL = 200;

export function useExecutionLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const bufferRef = useRef<LogEntry[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (bufferRef.current.length === 0) return;
    const batch = bufferRef.current;
    bufferRef.current = [];
    timerRef.current = null;
    setLogs((prev) => {
      const merged = [...prev, ...batch];
      return merged.length > MAX_LOGS ? merged.slice(-MAX_LOGS) : merged;
    });
  }, []);

  const appendLog = useCallback((data: ExecutionLogData) => {
    bufferRef.current.push({
      id: data.log_id || `${data.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
      level: data.level,
      message: data.message,
      timestamp: data.timestamp,
    });
    if (!timerRef.current) {
      timerRef.current = setTimeout(flush, FLUSH_INTERVAL);
    }
  }, [flush]);

  const setHistoricalLogs = useCallback((trace: ExecutionTrace[]) => {
    const entries: LogEntry[] = trace.map((t) => ({
      id: `trace-${t.id}`,
      level: t.error ? 'error' as const : 'info' as const,
      message: `[${t.step_type}] ${t.action || t.output || t.error || ''}`.trim(),
      timestamp: t.timestamp,
    }));
    setLogs(entries);
  }, []);

  const clear = useCallback(() => {
    bufferRef.current = [];
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setLogs([]);
  }, []);

  return { logs, appendLog, setHistoricalLogs, clear };
}

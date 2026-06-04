/**
 * CreateTaskModal Hooks
 * 模态框状态管理和业务逻辑 hooks
 */

import { useState, useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import i18next from 'i18next';
import type { FormInstance } from 'antd/es/form';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

// ==================== 时间轮状态 ====================
export interface TimeWheelState {
  selectedDays: number[];
  selectedHour: number;
  selectedMinute: number;
}

const INITIAL_TIME_WHEEL_STATE: TimeWheelState = {
  selectedDays: [1, 2, 3, 4, 5], // 默认周一到周五
  selectedHour: 9,
  selectedMinute: 0,
};

// ==================== Cron 表达式生成 ====================
export const generateCronExpression = (state: TimeWheelState): string => {
  const { selectedDays, selectedHour, selectedMinute } = state;

  // 如果选择了所有天 (0-6, 0=周日)
  if (selectedDays.length === 7) {
    return `${selectedMinute} ${selectedHour} * * *`;
  }

  // 如果只选择了工作日 (1-5)
  if (selectedDays.length === 5 && selectedDays.every(d => d >= 1 && d <= 5)) {
    return `${selectedMinute} ${selectedHour} * * 1-5`;
  }

  // 自定义星期
  const sortedDays = [...selectedDays].sort((a, b) => a - b);
  return `${selectedMinute} ${selectedHour} * * ${sortedDays.join(',')}`;
};

// ==================== 解析 Cron 表达式到状态 ====================
export const parseCronToState = (cron: string): TimeWheelState => {
  const parts = cron.split(' ');
  if (parts.length !== 5) return INITIAL_TIME_WHEEL_STATE;

  const [minute, hour, , , dayOfWeek] = parts;

  const selectedMinute = minute === '*' ? 0 : parseInt(minute, 10) || 0;
  const selectedHour = hour === '*' ? 0 : parseInt(hour, 10) || 0;

  let selectedDays: number[] = [1, 2, 3, 4, 5];

  if (dayOfWeek === '*') {
    selectedDays = [0, 1, 2, 3, 4, 5, 6];
  } else if (dayOfWeek.includes('-')) {
    // 处理范围如 1-5
    const [start, end] = dayOfWeek.split('-').map(Number);
    selectedDays = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  } else if (dayOfWeek.includes(',')) {
    // 处理逗号分隔
    selectedDays = dayOfWeek.split(',').map(Number);
  } else if (dayOfWeek !== '*') {
    selectedDays = [parseInt(dayOfWeek, 10)];
  }

  return {
    selectedDays,
    selectedHour,
    selectedMinute,
  };
};

// ==================== Cron 可读描述 ====================
export const getCronDescription = (cron: string): string => {
  const parts = cron.split(' ');
  if (parts.length !== 5) return cron;

  const [minute, hour, , , dayOfWeek] = parts;

  const daysMap = i18next.t('scheduler:days.full', { returnObjects: true }) as string[];
  const time = `${hour}:${minute.padStart(2, '0')}`;

  // 每天
  if (dayOfWeek === '*') {
    return i18next.t('scheduler:cronDesc.everyDay', { time });
  }

  // 工作日
  if (dayOfWeek === '1-5') {
    return i18next.t('scheduler:cronDesc.weekday', { time });
  }

  // 解析星期
  if (dayOfWeek.includes('-')) {
    const [start, end] = dayOfWeek.split('-');
    return i18next.t('scheduler:cronDesc.range', {
      start: daysMap[Number(start)],
      end: daysMap[Number(end)],
      time,
    });
  }
  if (dayOfWeek.includes(',')) {
    const separator = i18next.t('scheduler:cronDesc.listSeparator');
    const days = dayOfWeek.split(',').map((d) => daysMap[Number(d)]).join(separator);
    return i18next.t('scheduler:cronDesc.list', { days, time });
  }

  return i18next.t('scheduler:cronDesc.single', {
    day: daysMap[Number(dayOfWeek)],
    time,
  });
};

// ==================== 计算下次执行时间 ====================
export const getNextRunTime = (cron: string): string => {
  // 简化实现，实际项目中应使用 cron-parser 等库
  const now = new Date();
  const state = parseCronToState(cron);

  // 找到下一个匹配的日期
  let nextDate = new Date(now);
  nextDate.setHours(state.selectedHour, state.selectedMinute, 0, 0);

  // 如果今天的时间已过，检查下一个选中的日期
  if (nextDate <= now) {
    nextDate.setDate(nextDate.getDate() + 1);
  }

  // 找到匹配的星期
  const targetDays = state.selectedDays.sort();
  let daysToAdd = 0;
  let found = false;

  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + i);
    checkDate.setHours(state.selectedHour, state.selectedMinute, 0, 0);

    if (checkDate > now && targetDays.includes(checkDate.getDay())) {
      daysToAdd = i;
      found = true;
      break;
    }
  }

  if (found) {
    nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    nextDate.setHours(state.selectedHour, state.selectedMinute, 0, 0);
  }

  return dayjs(nextDate).fromNow();
};

// ==================== 时间轮 Hook ====================
export const useTimeWheel = (initialCron?: string) => {
  const initialState = useMemo(
    () => initialCron ? parseCronToState(initialCron) : INITIAL_TIME_WHEEL_STATE,
    [initialCron]
  );

  const [state, setState] = useState<TimeWheelState>(initialState);

  const toggleDay = useCallback((dayIndex: number) => {
    setState(prev => {
      const isSelected = prev.selectedDays.includes(dayIndex);

      // 至少保留一天
      if (isSelected && prev.selectedDays.length === 1) {
        return prev;
      }

      return {
        ...prev,
        selectedDays: isSelected
          ? prev.selectedDays.filter(d => d !== dayIndex)
          : [...prev.selectedDays, dayIndex],
      };
    });
  }, []);

  const setHour = useCallback((hour: number) => {
    setState(prev => ({ ...prev, selectedHour: hour }));
  }, []);

  const setMinute = useCallback((minute: number) => {
    setState(prev => ({ ...prev, selectedMinute: minute }));
  }, []);

  const cronExpression = useMemo(
    () => generateCronExpression(state),
    [state]
  );

  const description = useMemo(
    () => getCronDescription(cronExpression),
    [cronExpression]
  );

  const nextRunTime = useMemo(
    () => getNextRunTime(cronExpression),
    [cronExpression]
  );

  return {
    state,
    cronExpression,
    description,
    nextRunTime,
    toggleDay,
    setHour,
    setMinute,
    setState,
  };
};

// ==================== 资源选择 Hook ====================
export const useResourceSelection = <T extends string>() => {
  const [selected, setSelected] = useState<Set<T>>(new Set());

  const toggle = useCallback((item: T) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      if (newSet.has(item)) {
        newSet.delete(item);
      } else {
        newSet.add(item);
      }
      return newSet;
    });
  }, []);

  const isSelected = useCallback((item: T) => selected.has(item), [selected]);

  const setMultiple = useCallback((items: T[]) => {
    setSelected(new Set(items));
  }, []);

  const clear = useCallback(() => {
    setSelected(new Set());
  }, []);

  return {
    selected,
    toggle,
    isSelected,
    setMultiple,
    clear,
    selectedArray: Array.from(selected),
  };
};

// ==================== 模态框状态 Hook ====================
export const useCreateTaskModalState = () => {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openModal = useCallback(() => {
    setOpen(true);
    setEditingId(null);
    setSubmitting(false);
  }, []);

  const openEditModal = useCallback((id: string) => {
    setOpen(true);
    setEditingId(id);
    setSubmitting(false);
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
    setEditingId(null);
    setSubmitting(false);
  }, []);

  const isEditing = useMemo(() => editingId !== null, [editingId]);

  return {
    open,
    editingId,
    submitting,
    isEditing,
    setSubmitting,
    openModal,
    openEditModal,
    closeModal,
  };
};

// ==================== 表单验证 Hook ====================
export const useFormValidation = (form: FormInstance) => {
  const [validating, setValidating] = useState(false);

  const validateFields = useCallback(async () => {
    setValidating(true);
    try {
      const values = await form.validateFields();
      setValidating(false);
      return { valid: true, values };
    } catch (error) {
      setValidating(false);
      return { valid: false, values: null, error };
    }
  }, [form]);

  const resetValidation = useCallback(() => {
    setValidating(false);
  }, []);

  return {
    validating,
    validateFields,
    resetValidation,
  };
};

// ==================== Mock 数据 ====================
export const MOCK_BENCHMARKS = [
  { id: 'bm-1', name: 'Python Basics', icon: '🐍', category: 'programming' },
  { id: 'bm-2', name: 'JavaScript Algorithms', icon: '⚡', category: 'programming' },
  { id: 'bm-3', name: 'Go Concurrency', icon: '🔷', category: 'programming' },
  { id: 'bm-4', name: 'Rust Data Structures', icon: '🦀', category: 'programming' },
  { id: 'bm-5', name: 'Java Design Patterns', icon: '☕', category: 'design' },
];

export const MOCK_AGENTS = [
  { id: 'agent-1', name: 'GPT-4 Agent', icon: '🤖', model: 'gpt-4' },
  { id: 'agent-2', name: 'Claude-3.5', icon: '🧠', model: 'claude-3.5-sonnet' },
  { id: 'agent-3', name: 'Gemini-Pro', icon: '💎', model: 'gemini-pro' },
  { id: 'agent-4', name: 'Llama-3', icon: '🦙', model: 'llama-3-70b' },
];

// ==================== 优先级配置 ====================
export const getPriorityOptions = () => [
  { label: i18next.t('scheduler:priority.p1'), value: 'p1', color: '#ef4444' },
  { label: i18next.t('scheduler:priority.p2'), value: 'p2', color: '#f59e0b' },
  { label: i18next.t('scheduler:priority.p3'), value: 'p3', color: '#64748b' },
] as const;

// ==================== 分钟预设 ====================
export const MINUTE_PRESETS = [0, 15, 30, 45];

// ==================== 星期标签 ====================
export const getDayLabels = (): string[] =>
  i18next.t('scheduler:days.short', { returnObjects: true }) as string[];

// ==================== 星期全称 ====================
export const getDayFullNames = (): string[] =>
  i18next.t('scheduler:days.full', { returnObjects: true }) as string[];

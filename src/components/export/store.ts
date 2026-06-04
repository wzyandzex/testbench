/**
 * Export 状态管理
 * 数据导出模块 Zustand Store
 */

import { create } from 'zustand';
import type {
  ExportFormat,
  ExportFilters,
  ExportOptions,
  ExportType,
  ExportContext,
  ExportRequest,
} from './types';
import type { ExportResponse } from './types';

interface ExportState {
  // ========== UI 状态 ==========
  dialogVisible: boolean;
  quickExportLoading: boolean;

  // ========== 导出配置 ==========
  exportType: ExportType | null;
  exportContext: ExportContext | null;

  // 当前选中的配置
  config: {
    format: ExportFormat;
    filters: ExportFilters;
    options: ExportOptions;
  };

  // ========== 导出结果 ==========
  lastExport: ExportResponse | null;

  // ========== 操作 ==========

  // 打开对话框
  openDialog: (type: ExportType, context?: ExportContext) => void;

  // 关闭对话框
  closeDialog: () => void;

  // 设置导出类型
  setExportType: (type: ExportType) => void;

  // 设置导出上下文
  setExportContext: (context: ExportContext) => void;

  // 设置格式
  setFormat: (format: ExportFormat) => void;

  // 设置筛选条件
  setFilters: (filters: Partial<ExportFilters>) => void;

  // 设置选项
  setOptions: (options: Partial<ExportOptions>) => void;

  // 重置配置
  resetConfig: () => void;

  // 设置快速导出加载状态
  setQuickExportLoading: (loading: boolean) => void;

  // 设置最后导出结果
  setLastExport: (result: ExportResponse | null) => void;
}

// 默认筛选条件
const defaultFilters: ExportFilters = {
  dataRange: 'filtered',
};

// 默认选项
const defaultOptions: ExportOptions = {
  include_trace: false,
  include_artifacts: false,
  include_metadata: true,
  compress: false,
};

export const useExportStore = create<ExportState>((set) => ({
  // ========== 初始状态 ==========
  dialogVisible: false,
  quickExportLoading: false,
  exportType: null,
  exportContext: null,
  lastExport: null,
  config: {
    format: 'json',
    filters: defaultFilters,
    options: defaultOptions,
  },

  // ========== 操作实现 ==========

  // 打开对话框
  openDialog: (type, context) => set({
    dialogVisible: true,
    exportType: type,
    exportContext: context || null,
    config: {
      format: 'json',
      filters: { ...defaultFilters, ...context?.filters },
      options: defaultOptions,
    },
  }),

  // 关闭对话框
  closeDialog: () => set({
    dialogVisible: false,
  }),

  // 设置导出类型
  setExportType: (type) => set({ exportType: type }),

  // 设置导出上下文
  setExportContext: (context) => set({ exportContext: context }),

  // 设置格式
  setFormat: (format) => set((state) => ({
    config: { ...state.config, format },
  })),

  // 设置筛选条件
  setFilters: (filters) => set((state) => ({
    config: {
      ...state.config,
      filters: { ...state.config.filters, ...filters },
    },
  })),

  // 设置选项
  setOptions: (options) => set((state) => ({
    config: {
      ...state.config,
      options: { ...state.config.options, ...options },
    },
  })),

  // 重置配置
  resetConfig: () => set({
    config: {
      format: 'json',
      filters: defaultFilters,
      options: defaultOptions,
    },
    lastExport: null,
  }),

  // 设置快速导出加载状态
  setQuickExportLoading: (loading) => set({ quickExportLoading: loading }),

  // 设置最后导出结果
  setLastExport: (result) => set({ lastExport: result }),
}));

// ========== 选择器 Hooks ==========

/**
 * 获取对话框状态
 */
export const useExportDialogVisible = () => useExportStore((s) => s.dialogVisible);

/**
 * 获取导出类型
 */
export const useExportType = () => useExportStore((s) => s.exportType);

/**
 * 获取导出配置
 */
export const useExportConfig = () => useExportStore((s) => s.config);

/**
 * 获取导出上下文
 */
export const useExportContext = () => useExportStore((s) => s.exportContext);

/**
 * 获取最后导出结果
 */
export const useLastExport = () => useExportStore((s) => s.lastExport);

/**
 * 获取快速导出加载状态
 */
export const useQuickExportLoading = () => useExportStore((s) => s.quickExportLoading);

/**
 * 构建导出请求
 */
export const useBuildExportRequest = (): ExportRequest | null => {
  const exportType = useExportStore((s) => s.exportType);
  const config = useExportStore((s) => s.config);
  const exportContext = useExportStore((s) => s.exportContext);

  if (!exportType) return null;

  return {
    type: exportType,
    format: config.format,
    filters: {
      ...config.filters,
      ...exportContext?.filters,
    },
    options: config.options,
  };
};

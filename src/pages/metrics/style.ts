/**
 * Metrics 页面样式常量和 CSS
 * 优化的深浅色主题系统，数据可视化优先设计
 */

// ========== 样式常量 ==========

export const metricsPageStyle = {
  container: {
    padding: '32px 48px',
    maxWidth: 1600,
    margin: '0 auto',
  } as const,

  statCard: {
    padding: 24,
    borderRadius: 16,
    border: '1px solid var(--metrics-card-border)',
    background: 'var(--metrics-card-bg)',
    boxShadow: 'var(--metrics-card-shadow)',
  } as const,

  chartCard: {
    borderRadius: 16,
    border: '1px solid var(--metrics-card-border)',
    padding: 24,
    background: 'var(--metrics-card-bg)',
    boxShadow: 'var(--metrics-card-shadow)',
  } as const,

  filterSection: {
    padding: 20,
    borderRadius: 16,
    border: '1px solid var(--metrics-card-border)',
    background: 'var(--metrics-card-bg)',
    marginBottom: 24,
    boxShadow: 'var(--metrics-card-shadow)',
  } as const,
};

export const chartContainerStyle = {
  minHeight: 400,
} as const;

export const timeRangeButtonsStyle = {
  display: 'flex',
  gap: 8,
  marginBottom: 16,
} as const;

// ========== 生成完整的 CSS 变量 ==========

export const getMetricsCSS = () => `
  /* ========== Metrics 页面样式 ========== */

  /* 全局重置，确保 Ant Design 组件正确显示 */
  .metrics-page-container .ant-card,
  .metrics-page-container .ant-table,
  .metrics-page-container .ant-table-wrapper,
  .metrics-page-container .ant-select-selector,
  .metrics-page-container .ant-picker {
    background: var(--metrics-card-bg) !important;
    border-color: var(--metrics-card-border) !important;
  }

  /* ========== 暗色主题变量 ========== */
  [data-theme="dark"] {
    /* 背景色 */
    --metrics-bg-primary: #0f0f11;
    --metrics-bg-secondary: #1a1a1e;
    --metrics-bg-tertiary: #25252b;
    --metrics-bg-elevated: #1e1e24;

    /* 卡片样式 */
    --metrics-card-bg: rgba(30, 30, 38, 0.8);
    --metrics-card-border: rgba(255, 255, 255, 0.08);
    --metrics-card-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 0 0 1px rgba(255, 255, 255, 0.1);
    --metrics-card-shadow-hover: 0 8px 30px rgba(102, 126, 234, 0.15), 0 0 1px rgba(255, 255, 255, 0.1);

    /* 文字颜色 */
    --metrics-text-primary: rgba(255, 255, 255, 0.95);
    --metrics-text-secondary: rgba(255, 255, 255, 0.65);
    --metrics-text-tertiary: rgba(255, 255, 255, 0.45);
    --metrics-text-disabled: rgba(255, 255, 255, 0.25);

    /* 边框 */
    --metrics-border-color: rgba(255, 255, 255, 0.08);
    --metrics-border-hover: rgba(255, 255, 255, 0.15);
    --metrics-border-focus: rgba(102, 126, 234, 0.5);

    /* 品牌色 */
    --metrics-brand-primary: #667eea;
    --metrics-brand-secondary: #764ba2;
    --metrics-brand-accent: #f093fb;
    --metrics-brand-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

    /* 功能色 */
    --metrics-color-success: #10b981;
    --metrics-color-success-bg: rgba(16, 185, 129, 0.15);
    --metrics-color-warning: #f59e0b;
    --metrics-color-warning-bg: rgba(245, 158, 11, 0.15);
    --metrics-color-error: #ef4444;
    --metrics-color-error-bg: rgba(239, 68, 68, 0.15);
    --metrics-color-info: #1677ff;
    --metrics-color-info-bg: rgba(22, 119, 255, 0.15);

    /* 图表颜色 */
    --metrics-chart-color-1: #667eea;
    --metrics-chart-color-2: #10b981;
    --metrics-chart-color-3: #f59e0b;
    --metrics-chart-color-4: #ef4444;
    --metrics-chart-color-5: #8b5cf6;

    /* 覆盖层 */
    --metrics-overlay: rgba(0, 0, 0, 0.7);
    --metrics-backdrop: blur(20px);
  }

  /* ========== 亮色主题变量 ========== */
  [data-theme="light"] {
    /* 背景色 */
    --metrics-bg-primary: #fafafa;
    --metrics-bg-secondary: #ffffff;
    --metrics-bg-tertiary: #f5f5f5;
    --metrics-bg-elevated: #ffffff;

    /* 卡片样式 - 使用更强的阴影和边框来区分 */
    --metrics-card-bg: #ffffff;
    --metrics-card-border: #e5e7eb;
    --metrics-card-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
    --metrics-card-shadow-hover: 0 8px 24px rgba(102, 126, 234, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08);

    /* 文字颜色 */
    --metrics-text-primary: #1f2937;
    --metrics-text-secondary: #6b7280;
    --metrics-text-tertiary: #9ca3af;
    --metrics-text-disabled: #d1d5db;

    /* 边框 */
    --metrics-border-color: #e5e7eb;
    --metrics-border-hover: #d1d5db;
    --metrics-border-focus: #667eea;

    /* 品牌色 */
    --metrics-brand-primary: #667eea;
    --metrics-brand-secondary: #764ba2;
    --metrics-brand-accent: #f093fb;
    --metrics-brand-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

    /* 功能色 */
    --metrics-color-success: #10b981;
    --metrics-color-success-bg: rgba(16, 185, 129, 0.1);
    --metrics-color-warning: #f59e0b;
    --metrics-color-warning-bg: rgba(245, 158, 11, 0.1);
    --metrics-color-error: #ef4444;
    --metrics-color-error-bg: rgba(239, 68, 68, 0.1);
    --metrics-color-info: #1677ff;
    --metrics-color-info-bg: rgba(22, 119, 255, 0.1);

    /* 图表颜色 */
    --metrics-chart-color-1: #667eea;
    --metrics-chart-color-2: #10b981;
    --metrics-chart-color-3: #f59e0b;
    --metrics-chart-color-4: #ef4444;
    --metrics-chart-color-5: #8b5cf6;

    /* 覆盖层 */
    --metrics-overlay: rgba(0, 0, 0, 0.4);
    --metrics-backdrop: blur(20px);
  }

  /* ========== 全局表格样式重写 ========== */
  .metrics-page-container .ant-table-thead > tr > th {
    background: var(--metrics-bg-tertiary) !important;
    border-bottom: 2px solid var(--metrics-border-color) !important;
    color: var(--metrics-text-primary) !important;
    font-weight: 600 !important;
    font-size: 13px !important;
    padding: 14px 16px !important;
  }

  .metrics-page-container .ant-table-tbody > tr > td {
    background: var(--metrics-card-bg) !important;
    border-bottom: 1px solid var(--metrics-border-color) !important;
    color: var(--metrics-text-primary) !important;
    padding: 14px 16px !important;
  }

  .metrics-page-container .ant-table-tbody > tr:hover > td {
    background: var(--metrics-bg-tertiary) !important;
  }

  /* ========== 全局 Card 样式重写 ========== */
  .metrics-page-container .ant-card {
    background: var(--metrics-card-bg) !important;
    border: 1px solid var(--metrics-card-border) !important;
    box-shadow: var(--metrics-card-shadow) !important;
  }

  .metrics-page-container .ant-card-head {
    background: var(--metrics-bg-elevated) !important;
    border-bottom: 1px solid var(--metrics-border-color) !important;
    padding: 18px 24px !important;
  }

  .metrics-page-container .ant-card-head-title {
    font-size: 16px !important;
    font-weight: 600 !important;
    color: var(--metrics-text-primary) !important;
  }

  .metrics-page-container .ant-card-body {
    background: transparent !important;
    color: var(--metrics-text-primary) !important;
  }

  /* ========== Select 和 Picker 样式 ========== */
  .metrics-page-container .ant-select-selector {
    background: var(--metrics-card-bg) !important;
    border-color: var(--metrics-border-color) !important;
    color: var(--metrics-text-primary) !important;
  }

  .metrics-page-container .ant-select-focused .ant-select-selector {
    border-color: var(--metrics-border-focus) !important;
    box-shadow: 0 0 0 2px var(--metrics-color-info-bg) !important;
  }

  .metrics-page-container .ant-picker {
    background: var(--metrics-card-bg) !important;
    border-color: var(--metrics-border-color) !important;
  }

  .metrics-page-container .ant-picker-input {
    color: var(--metrics-text-primary) !important;
  }

  /* ========== Button 样式 ========== */
  .metrics-page-container .ant-btn-primary {
    background: var(--metrics-brand-gradient) !important;
    border: none !important;
    border-radius: 10px !important;
    font-weight: 600 !important;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3) !important;
  }

  .metrics-page-container .ant-btn-primary:hover {
    background: linear-gradient(135deg, #764ba2 0%, #667eea 100%) !important;
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4) !important;
  }

  .metrics-page-container .ant-btn-default {
    background: var(--metrics-card-bg) !important;
    border-color: var(--metrics-border-color) !important;
    color: var(--metrics-text-primary) !important;
  }

  .metrics-page-container .ant-btn-default:hover {
    border-color: var(--metrics-border-focus) !important;
    color: var(--metrics-brand-primary) !important;
  }

  /* ========== Tabs 样式 ========== */
  .metrics-page-container .ant-tabs-tab {
    color: var(--metrics-text-secondary) !important;
    font-weight: 500 !important;
    font-size: 14px !important;
    padding: 12px 20px !important;
  }

  .metrics-page-container .ant-tabs-tab-active {
    color: var(--metrics-brand-primary) !important;
    font-weight: 600 !important;
  }

  .metrics-page-container .ant-tabs-ink-bar {
    background: var(--metrics-brand-gradient) !important;
    height: 3px !important;
    border-radius: 2px !important;
  }

  /* ========== Progress 样式 ========== */
  .metrics-page-container .ant-progress-bg {
    background: var(--metrics-brand-gradient) !important;
  }

  /* ========== Tag 样式 ========== */
  .metrics-page-container .ant-tag {
    border-radius: 6px !important;
    padding: 4px 10px !important;
    font-weight: 500 !important;
  }

  /* ========== Statistic 样式 ========== */
  .metrics-page-container .ant-statistic-title {
    color: var(--metrics-text-secondary) !important;
    font-size: 13px !important;
  }

  .metrics-page-container .ant-statistic-content {
    color: var(--metrics-text-primary) !important;
  }

  /* ========== 容器动画 ========== */
  .metrics-page-container {
    min-height: 100vh;
    animation: metricsPageFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes metricsPageFadeIn {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ========== 统计卡片 ========== */
  .metrics-stat-card {
    background: var(--metrics-card-bg);
    border: 1px solid var(--metrics-card-border);
    border-radius: 16px;
    padding: 24px;
    box-shadow: var(--metrics-card-shadow);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
  }

  .metrics-stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--metrics-brand-gradient);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .metrics-stat-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--metrics-card-shadow-hover);
    border-color: var(--metrics-border-focus);
  }

  .metrics-stat-card:hover::before {
    opacity: 1;
  }

  /* ========== 图表容器 ========== */
  .metrics-chart-container {
    background: var(--metrics-card-bg);
    border: 1px solid var(--metrics-card-border);
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 32px;
    box-shadow: var(--metrics-card-shadow);
  }

  /* ========== Agent 卡片 ========== */
  .metrics-agent-card {
    background: var(--metrics-card-bg);
    border: 1px solid var(--metrics-card-border);
    border-radius: 16px;
    padding: 24px;
    box-shadow: var(--metrics-card-shadow);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
  }

  .metrics-agent-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--metrics-brand-gradient);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .metrics-agent-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--metrics-card-shadow-hover);
    border-color: var(--metrics-border-focus);
  }

  .metrics-agent-card:hover::before {
    opacity: 1;
  }

  .metrics-agent-card-header {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
  }

  .metrics-agent-avatar {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: var(--metrics-brand-gradient);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 18px;
    margin-right: 16px;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .metrics-agent-name {
    font-size: 17px;
    font-weight: 700;
    color: var(--metrics-text-primary);
    letter-spacing: -0.3px;
  }

  /* ========== 对比矩阵表格 ========== */
  .metrics-comparison-table {
    background: var(--metrics-card-bg);
    border: 1px solid var(--metrics-card-border);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: var(--metrics-card-shadow);
  }

  .metrics-comparison-cell {
    padding: 16px;
    border-bottom: 1px solid var(--metrics-border-color);
    text-align: center;
    color: var(--metrics-text-primary);
  }

  .metrics-comparison-cell:last-child {
    border-bottom: none;
  }

  /* ========== 报告列表 ========== */
  .metrics-report-list-container {
    background: var(--metrics-card-bg);
    border: 1px solid var(--metrics-card-border);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: var(--metrics-card-shadow);
  }

  .metrics-report-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--metrics-border-color);
    background: var(--metrics-bg-elevated);
  }

  .metrics-report-list-title {
    font-size: 17px;
    font-weight: 700;
    color: var(--metrics-text-primary);
    letter-spacing: -0.3px;
  }

  .metrics-report-item {
    display: flex;
    align-items: center;
    padding: 18px 24px;
    border-bottom: 1px solid var(--metrics-border-color);
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .metrics-report-item:hover {
    background: var(--metrics-bg-tertiary);
  }

  .metrics-report-item:last-child {
    border-bottom: none;
  }

  /* ========== 清理报告 ========== */
  .metrics-cleanup-list-container {
    background: var(--metrics-card-bg);
    border: 1px solid var(--metrics-card-border);
    border-radius: 16px;
    padding: 24px;
    box-shadow: var(--metrics-card-shadow);
  }

  .metrics-cleanup-item {
    display: flex;
    align-items: center;
    padding: 18px;
    border-bottom: 1px solid var(--metrics-border-color);
    transition: all 0.2s ease;
    border-radius: 12px;
    margin-bottom: 8px;
  }

  .metrics-cleanup-item:hover {
    background: var(--metrics-bg-tertiary);
  }

  .metrics-cleanup-item:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  /* ========== 趋势图表特殊样式 ========== */
  .metrics-trend-chart {
    border-radius: 16px;
    overflow: hidden;
  }

  .metrics-trend-chart .echarts-for-react div {
    border-radius: 12px;
  }

  /* ========== 响应式设计 ========== */
  @media (max-width: 1279px) {
    .metrics-page-container {
      padding: 24px 32px;
    }

    .metrics-stat-card,
    .metrics-agent-card,
    .metrics-chart-container {
      padding: 20px;
    }
  }

  @media (max-width: 767px) {
    .metrics-page-container {
      padding: 20px;
    }

    .metrics-stat-card,
    .metrics-agent-card {
      padding: 16px;
    }

    .metrics-chart-container {
      padding: 16px;
    }
  }

  /* ========== 减少动画模式 ========== */
  @media (prefers-reduced-motion: reduce) {
    .metrics-page-container,
    .metrics-stat-card,
    .metrics-agent-card {
      animation: none !important;
      transition: none !important;
    }
  }

  /* ========== 打印样式 ========== */
  @media print {
    .metrics-page-container {
      background: white !important;
      color: black !important;
    }

    .metrics-stat-card,
    .metrics-agent-card,
    .metrics-chart-container {
      box-shadow: none !important;
      border: 1px solid #ddd !important;
      page-break-inside: avoid;
    }
  }
`;

export default metricsPageStyle;

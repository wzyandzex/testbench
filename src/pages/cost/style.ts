/**
 * Cost page style constants and CSS
 * Supports dark/light dual themes
 */

// Style constants
export const costPageStyle = {
  container: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '32px 48px',
  } as const,

  header: {
    marginBottom: 24,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as const,

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 20,
    marginBottom: 32,
  } as const,

  chartSection: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: 20,
    marginBottom: 32,
  } as const,

  tableSection: {
    marginBottom: 32,
  } as const,
} as const;

// Generate CSS variables
export const getCostCSS = () => `
  /* ========== Cost page styles ========== */

  /* Dark theme variables */
  [data-theme="dark"] {
    --cost-card-bg: rgba(26, 26, 26, 0.6);
    --cost-card-border: rgba(255, 255, 255, 0.08);
    --cost-text: rgba(255, 255, 255, 0.95);
    --cost-text-secondary: rgba(255, 255, 255, 0.65);
    --cost-text-tertiary: rgba(255, 255, 255, 0.45);

    /* Trend colors */
    --cost-trend-up: #10b981;
    --cost-trend-down: #ef4444;

    /* Budget progress bar */
    --budget-safe: #10b981;
    --budget-warning: #f59e0b;
    --budget-danger: #ef4444;
  }

  /* Light theme variables */
  [data-theme="light"] {
    --cost-card-bg: #ffffff;
    --cost-card-border: rgba(0, 0, 0, 0.08);
    --cost-text: rgba(0, 0, 0, 0.88);
    --cost-text-secondary: rgba(0, 0, 0, 0.65);
    --cost-text-tertiary: rgba(0, 0, 0, 0.45);

    /* Trend colors */
    --cost-trend-up: #10b981;
    --cost-trend-down: #ef4444;

    /* Budget progress bar */
    --budget-safe: #10b981;
    --budget-warning: #f59e0b;
    --budget-danger: #ef4444;
  }

  /* ========== Container ========== */
  .cost-page-container {
    min-height: 100vh;
    animation: costPageFadeIn 0.4s ease-out;
  }

  @keyframes costPageFadeIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ========== Stats cards ========== */
  .cost-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 32px;
  }

  .cost-stat-card {
    background: var(--cost-card-bg);
    border: 1px solid var(--cost-card-border);
    border-radius: 12px;
    padding: 20px;
    transition: all 0.2s ease;
  }

  .cost-stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .cost-stat-value {
    font-size: 28px;
    font-weight: 600;
    color: var(--cost-text);
    margin-bottom: 8px;
  }

  .cost-stat-label {
    font-size: 13px;
    color: var(--cost-text-secondary);
    margin-bottom: 8px;
  }

  .cost-stat-trend {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 12px;
  }

  .cost-stat-trend.positive {
    background: rgba(16, 185, 129, 0.1);
    color: var(--cost-trend-up);
  }

  .cost-stat-trend.negative {
    background: rgba(239, 68, 68, 0.1);
    color: var(--cost-trend-down);
  }

  /* ========== Chart container ========== */
  .cost-chart-card {
    background: var(--cost-card-bg);
    border: 1px solid var(--cost-card-border);
    border-radius: 12px;
    padding: 20px;
  }

  .cost-chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .cost-chart-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--cost-text);
  }

  /* ========== Budget progress bar ========== */
  .budget-progress-container {
    background: var(--cost-card-bg);
    border: 1px solid var(--cost-card-border);
    border-radius: 12px;
    padding: 20px;
  }

  .budget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .budget-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--cost-text);
  }

  .budget-amount {
    font-size: 14px;
    font-weight: 600;
    color: var(--cost-text);
  }

  .budget-progress-bar {
    height: 8px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .budget-progress-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease, background-color 0.3s ease;
  }

  .budget-progress-fill.safe {
    background: var(--budget-safe);
  }

  .budget-progress-fill.warning {
    background: var(--budget-warning);
  }

  .budget-progress-fill.danger {
    background: var(--budget-danger);
  }

  .budget-footer {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--cost-text-secondary);
  }

  /* ========== Model cost table ========== */
  .model-cost-table .ant-table {
    background: transparent;
  }

  .model-cost-table .ant-table-thead > tr > th {
    background: var(--cost-card-bg);
    border-color: var(--cost-card-border);
    color: var(--cost-text);
  }

  .model-cost-table .ant-table-tbody > tr > td {
    background: transparent;
    border-color: var(--cost-card-border);
    color: var(--cost-text);
  }

  .model-cost-table .ant-table-tbody > tr:hover > td {
    background: rgba(102, 126, 234, 0.05);
  }

  /* ========== Project cost tab ========== */
  .project-cost-tabs {
    background: var(--cost-card-bg);
    border: 1px solid var(--cost-card-border);
    border-radius: 12px;
    padding: 20px;
  }

  .project-cost-tabs .ant-tabs-tab {
    color: var(--cost-text-secondary);
  }

  .project-cost-tabs .ant-tabs-tab-active {
    color: #667eea;
  }

  .project-cost-tabs .ant-tabs-ink-bar {
    background: #667eea;
  }

  /* ========== Optimization suggestions ========== */
  .optimization-tips-container {
    background: var(--cost-card-bg);
    border: 1px solid var(--cost-card-border);
    border-radius: 12px;
    padding: 20px;
  }

  .optimization-tip-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 8px;
    transition: background 0.2s ease;
  }

  .optimization-tip-item:hover {
    background: rgba(102, 126, 234, 0.05);
  }

  .tip-priority-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 6px;
  }

  .tip-priority-dot.high {
    background: #ef4444;
  }

  .tip-priority-dot.medium {
    background: #f59e0b;
  }

  .tip-priority-dot.low {
    background: #10b981;
  }

  .tip-content {
    flex: 1;
  }

  .tip-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--cost-text);
    margin-bottom: 4px;
  }

  .tip-description {
    font-size: 13px;
    color: var(--cost-text-secondary);
    margin-bottom: 6px;
  }

  .tip-savings {
    font-size: 12px;
    color: var(--cost-trend-up);
  }

  /* ========== Responsive design ========== */
  @media (max-width: 1279px) {
    .cost-stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 767px) {
    .cost-page-container {
      padding: 24px 20px;
    }

    .cost-stats-grid {
      grid-template-columns: 1fr;
    }
  }

  /* ========== Reduced motion mode ========== */
  @media (prefers-reduced-motion: reduce) {
    .cost-page-container,
    .cost-stat-card,
    .budget-progress-fill {
      animation: none !important;
      transition: none !important;
    }
  }
`;

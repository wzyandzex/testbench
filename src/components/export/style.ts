/**
 * Export 组件样式
 * 支持暗色/亮色双主题
 */

// 生成 CSS 变量 - 全局作用域，确保 Modal 内也能使用
export const getExportCSS = () => `
  /* ========== Export 组件样式 - 全局 ========== */

  /* ========== CSS 变量定义 ========== */

  /* 暗色主题变量 */
  [data-theme="dark"] {
    --export-dialog-bg: rgba(26, 26, 26, 0.95);
    --export-card-border: rgba(255, 255, 255, 0.08);
    --export-option-bg: rgba(102, 126, 234, 0.08);
    --export-option-hover-bg: rgba(102, 126, 234, 0.15);
    --export-option-selected-bg: rgba(102, 126, 234, 0.2);
    --export-option-selected-border: rgba(102, 126, 234, 0.4);
    --export-text: rgba(255, 255, 255, 0.95);
    --export-text-secondary: rgba(255, 255, 255, 0.65);
    --export-text-tertiary: rgba(255, 255, 255, 0.45);
  }

  /* 亮色主题变量 */
  [data-theme="light"] {
    --export-dialog-bg: #ffffff;
    --export-card-border: rgba(0, 0, 0, 0.08);
    --export-option-bg: rgba(102, 126, 234, 0.06);
    --export-option-hover-bg: rgba(102, 126, 234, 0.1);
    --export-option-selected-bg: rgba(102, 126, 234, 0.12);
    --export-option-selected-border: rgba(102, 126, 234, 0.3);
    --export-text: rgba(0, 0, 0, 0.88);
    --export-text-secondary: rgba(0, 0, 0, 0.65);
    --export-text-tertiary: rgba(0, 0, 0, 0.45);
  }

  /* ========== 格式选择器 ========== */
  .export-format-selector {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .export-format-card {
    position: relative;
    background: var(--export-card-bg);
    border: 1px solid var(--export-card-border);
    border-radius: 10px;
    padding: 16px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    overflow: hidden;
  }

  .export-format-card:hover:not(.disabled) {
    background: var(--export-option-hover-bg);
    border-color: var(--export-option-selected-border);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  }

  .export-format-card.selected {
    background: var(--export-option-selected-bg);
    border-color: var(--export-option-selected-border);
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.15);
  }

  .export-format-card.selected::after {
    content: '';
    position: absolute;
    top: 8px;
    right: 8px;
    width: 16px;
    height: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/%3E%3C/svg%3E");
    background-size: 10px;
    background-position: center;
    background-repeat: no-repeat;
  }

  .export-format-card.disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .export-format-card .format-icon {
    font-size: 28px;
    margin-bottom: 8px;
  }

  .export-format-card .format-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--export-text);
    margin-bottom: 4px;
  }

  .export-format-card .format-description {
    font-size: 11px;
    color: var(--export-text-secondary);
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .export-format-card .format-meta {
    display: flex;
    justify-content: center;
    gap: 8px;
    font-size: 10px;
    color: var(--export-text-tertiary);
  }

  .export-format-card .format-extension {
    background: rgba(102, 126, 234, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 500;
  }

  /* ========== Modal 样式修复 ========== */
  .export-dialog-root .ant-modal-content {
    background: var(--export-dialog-bg) !important;
  }

  .export-dialog-root .ant-modal-header {
    background: var(--export-dialog-bg) !important;
    border-bottom: 1px solid var(--export-card-border) !important;
  }

  .export-dialog-root .ant-modal-title {
    color: var(--export-text) !important;
  }

  .export-dialog-root .ant-modal-close-x {
    color: var(--export-text-secondary) !important;
  }

  .export-dialog-root .ant-modal-close-x:hover {
    color: var(--export-text) !important;
  }

  .export-dialog-root .ant-modal-body {
    color: var(--export-text) !important;
  }

  /* ========== 响应式设计 ========== */
  @media (max-width: 767px) {
    .export-format-selector {
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .export-format-card {
      padding: 12px;
    }

    .export-format-card .format-icon {
      font-size: 24px;
    }

    .export-format-card .format-name {
      font-size: 13px;
    }

    .export-format-card .format-description {
      font-size: 10px;
    }
  }

  /* ========== 减少动画模式 ========== */
  @media (prefers-reduced-motion: reduce) {
    .export-format-card,
    .export-format-card:hover {
      animation: none !important;
      transition: none !important;
    }
  }
`;

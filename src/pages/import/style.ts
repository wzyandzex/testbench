/**
 * Import 页面样式常量和 CSS
 * 支持暗色/亮色双主题
 */

// 样式常量
export const importPageStyle = {
  container: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '32px 48px',
  } as const,

  containerMobile: {
    padding: '24px 20px',
  } as const,

  header: {
    marginBottom: 24,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as const,

  headerTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 600,
  } as const,

  datasetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 20,
    marginBottom: 32,
  } as const,

  // 响应式断点
  breakpoints: {
    xs: 480,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  } as const,
} as const;

// 导出样式类名
export const importClasses = {
  container: 'import-page-container',
  header: 'import-header',
  datasetGrid: 'import-dataset-grid',
  datasetCard: 'import-dataset-card',
  sourceSelector: 'import-source-selector',
  fileUploader: 'import-file-uploader',
  taskList: 'import-task-list',
  progressCard: 'import-progress-card',
} as const;

// 生成 CSS 变量 - 全局作用域，确保 Modal 内也能使用
export const getImportCSS = () => `
  /* ========== Import 页面样式 - 全局 ========== */

  /* ========== CSS 变量定义 - 全局 ========== */

  /* 暗色主题变量 */
  [data-theme="dark"] {
    --import-bg: rgba(26, 26, 26, 0.8);
    --import-card-bg: rgba(26, 26, 26, 0.6);
    --import-card-border: rgba(255, 255, 255, 0.08);
    --import-card-hover-bg: rgba(102, 126, 234, 0.1);
    --import-card-selected-bg: rgba(102, 126, 234, 0.15);
    --import-card-selected-border: rgba(102, 126, 234, 0.4);
    --import-text: rgba(255, 255, 255, 0.95);
    --import-text-secondary: rgba(255, 255, 255, 0.65);
    --import-text-tertiary: rgba(255, 255, 255, 0.45);

    /* 上传区域 */
    --upload-area-bg: rgba(26, 26, 26, 0.4);
    --upload-area-border: rgba(102, 126, 234, 0.3);
    --upload-area-hover-bg: rgba(102, 126, 234, 0.08);
    --upload-area-hover-border: rgba(102, 126, 234, 0.5);
    --upload-area-drag-bg: rgba(102, 126, 234, 0.12);

    /* 进度条 */
    --progress-bg: rgba(255, 255, 255, 0.1);
    --progress-bar: linear-gradient(90deg, #667eea, #764ba2);

    /* 来源选择器 */
    --source-item-bg: rgba(26, 26, 26, 0.6);
    --source-item-border: rgba(255, 255, 255, 0.08);
    --source-item-hover-bg: rgba(102, 126, 234, 0.08);
    --source-item-selected-bg: rgba(102, 126, 234, 0.15);
    --source-item-selected-border: rgba(102, 126, 234, 0.3);
  }

  /* 亮色主题变量 */
  [data-theme="light"] {
    --import-bg: #ffffff;
    --import-card-bg: #ffffff;
    --import-card-border: rgba(0, 0, 0, 0.08);
    --import-card-hover-bg: rgba(102, 126, 234, 0.04);
    --import-card-selected-bg: rgba(102, 126, 234, 0.08);
    --import-card-selected-border: rgba(102, 126, 234, 0.3);
    --import-text: rgba(0, 0, 0, 0.88);
    --import-text-secondary: rgba(0, 0, 0, 0.65);
    --import-text-tertiary: rgba(0, 0, 0, 0.45);

    /* 上传区域 */
    --upload-area-bg: #fafafa;
    --upload-area-border: rgba(102, 126, 234, 0.2);
    --upload-area-hover-bg: rgba(102, 126, 234, 0.04);
    --upload-area-hover-border: rgba(102, 126, 234, 0.4);
    --upload-area-drag-bg: rgba(102, 126, 234, 0.08);

    /* 进度条 */
    --progress-bg: rgba(0, 0, 0, 0.06);
    --progress-bar: linear-gradient(90deg, #667eea, #764ba2);

    /* 来源选择器 */
    --source-item-bg: #ffffff;
    --source-item-border: rgba(0, 0, 0, 0.08);
    --source-item-hover-bg: rgba(102, 126, 234, 0.04);
    --source-item-selected-bg: rgba(102, 126, 234, 0.08);
    --source-item-selected-border: rgba(102, 126, 234, 0.25);
  }

  /* ========== 容器 ========== */
  .import-page-container {
    min-height: 100vh;
    animation: importPageFadeIn 0.4s ease-out;
  }

  @keyframes importPageFadeIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ========== 数据集卡片 ========== */
  .import-dataset-card {
    position: relative;
    background: var(--import-card-bg);
    border: 1px solid var(--import-card-border);
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }

  .import-dataset-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .import-dataset-card:hover {
    background: var(--import-card-hover-bg);
    border-color: var(--import-card-selected-border);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
  }

  .import-dataset-card:hover::before {
    opacity: 1;
  }

  .import-dataset-card.selected {
    background: var(--import-card-selected-bg);
    border-color: var(--import-card-selected-border);
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  }

  .import-dataset-card.selected::after {
    content: '';
    position: absolute;
    top: 12px;
    right: 12px;
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/%3E%3C/svg%3E");
    background-size: 14px;
    background-position: center;
    background-repeat: no-repeat;
  }

  .import-dataset-card .dataset-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.1) 100%);
    border-radius: 12px;
    font-size: 24px;
    color: #667eea;
    margin-bottom: 12px;
  }

  .import-dataset-card .dataset-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--import-text);
    margin-bottom: 6px;
  }

  .import-dataset-card .dataset-description {
    font-size: 13px;
    color: var(--import-text-secondary);
    line-height: 1.5;
    margin-bottom: 12px;
  }

  .import-dataset-card .dataset-meta {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: var(--import-text-tertiary);
  }

  .import-dataset-card .dataset-meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* ========== 来源选择器 ========== */
  .import-source-selector {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .source-item {
    background: var(--source-item-bg);
    border: 1px solid var(--source-item-border);
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
  }

  .source-item:hover {
    background: var(--source-item-hover-bg);
    border-color: var(--source-item-selected-border);
  }

  .source-item.selected {
    background: var(--source-item-selected-bg);
    border-color: var(--source-item-selected-border);
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.15);
  }

  .source-item .source-icon {
    font-size: 32px;
    color: #667eea;
    margin-bottom: 12px;
  }

  .source-item .source-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--import-text);
  }

  /* ========== 文件上传区域 ========== */
  .import-file-uploader {
    position: relative;
  }

  .upload-area {
    background: var(--upload-area-bg);
    border: 2px dashed var(--upload-area-border);
    border-radius: 12px;
    padding: 48px 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .upload-area:hover {
    background: var(--upload-area-hover-bg);
    border-color: var(--upload-area-hover-border);
  }

  .upload-area.dragging {
    background: var(--upload-area-drag-bg);
    border-color: #667eea;
    transform: scale(1.01);
  }

  .upload-area .upload-icon {
    font-size: 48px;
    color: #667eea;
    margin-bottom: 16px;
    opacity: 0.8;
  }

  .upload-area .upload-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--import-text);
    margin-bottom: 8px;
  }

  .upload-area .upload-hint {
    font-size: 13px;
    color: var(--import-text-secondary);
  }

  .upload-area .upload-formats {
    margin-top: 12px;
    font-size: 12px;
    color: var(--import-text-tertiary);
  }

  /* 文件预览 */
  .file-preview {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--upload-area-bg);
    border: 1px solid var(--upload-area-border);
    border-radius: 8px;
    margin-top: 16px;
  }

  .file-preview .file-icon {
    font-size: 24px;
    color: #667eea;
  }

  .file-preview .file-info {
    flex: 1;
  }

  .file-preview .file-name {
    font-size: 14px;
    color: var(--import-text);
    margin-bottom: 2px;
  }

  .file-preview .file-size {
    font-size: 12px;
    color: var(--import-text-secondary);
  }

  .file-preview .file-remove {
    color: var(--import-text-secondary);
    cursor: pointer;
    transition: color 0.2s ease;
  }

  .file-preview .file-remove:hover {
    color: #ef4444;
  }

  /* ========== 进度条 ========== */
  .import-progress-bar {
    margin-top: 16px;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .progress-label {
    font-size: 13px;
    color: var(--import-text);
  }

  .progress-percentage {
    font-size: 13px;
    font-weight: 500;
    color: #667eea;
  }

  .progress-track {
    height: 6px;
    background: var(--progress-bg);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: var(--progress-bar);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .progress-stats {
    display: flex;
    gap: 16px;
    margin-top: 12px;
    font-size: 12px;
  }

  .progress-stat {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--import-text-secondary);
  }

  .progress-stat.success {
    color: #10b981;
  }

  .progress-stat.failed {
    color: #ef4444;
  }

  .progress-stat.skipped {
    color: #f59e0b;
  }

  /* ========== 任务列表 ========== */
  .import-task-list {
    margin-top: 32px;
  }

  .task-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .task-list-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--import-text);
  }

  .task-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  .task-status-badge.pending {
    background: rgba(0, 0, 0, 0.06);
    color: var(--import-text-secondary);
  }

  .task-status-badge.running {
    background: rgba(22, 119, 255, 0.1);
    color: #1677ff;
  }

  .task-status-badge.completed {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  .task-status-badge.failed {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  .task-status-badge.cancelled {
    background: rgba(0, 0, 0, 0.06);
    color: var(--import-text-tertiary);
  }

  /* ========== 响应式设计 ========== */
  @media (max-width: 1279px) {
    .import-dataset-grid,
    .import-source-selector {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 767px) {
    .import-page-container {
      padding: 24px 20px;
    }

    .import-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }

    .import-dataset-grid,
    .import-source-selector {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .import-dataset-card {
      padding: 16px;
    }

    .upload-area {
      padding: 32px 16px;
    }

    .upload-area .upload-icon {
      font-size: 36px;
    }
  }

  @media (max-width: 480px) {
    .import-dataset-card .dataset-icon {
      width: 40px;
      height: 40px;
      font-size: 20px;
    }

    .import-dataset-card .dataset-name {
      font-size: 14px;
    }

    .import-dataset-card .dataset-description {
      font-size: 12px;
    }
  }

  /* ========== 减少动画模式 ========== */
  @media (prefers-reduced-motion: reduce) {
    .import-page-container,
    .import-dataset-card,
    .source-item,
    .upload-area,
    .progress-fill {
      animation: none !important;
      transition: none !important;
    }
  }

  /* ========== Modal 样式修复 ========== */
  /* 确保 Modal 内内容可见 */
  .import-modal-root .ant-modal-content {
    background: var(--import-card-bg) !important;
  }

  .import-modal-root .ant-modal-header {
    background: var(--import-card-bg) !important;
    border-bottom: 1px solid var(--import-card-border) !important;
  }

  .import-modal-root .ant-modal-title {
    color: var(--import-text) !important;
  }

  .import-modal-root .ant-modal-close-x {
    color: var(--import-text-secondary) !important;
  }

  .import-modal-root .ant-modal-close-x:hover {
    color: var(--import-text) !important;
  }

  .import-modal-root .ant-modal-body {
    color: var(--import-text) !important;
  }

  /* Steps 组件样式修复 */
  .import-modal-root .ant-steps-item-title {
    color: var(--import-text-secondary) !important;
  }

  .import-modal-root .ant-steps-item-description {
    color: var(--import-text-tertiary) !important;
  }

  .import-modal-root .ant-steps-item-process .ant-steps-item-icon {
    background: #667eea !important;
    border-color: #667eea !important;
  }

  .import-modal-root .ant-steps-item-process .ant-steps-item-title {
    color: #667eea !important;
  }
`;

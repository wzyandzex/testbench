/**
 * Notification 页面样式常量和 CSS
 * 支持暗色/亮色双主题
 */

// 样式常量
export const notificationPageStyle = {
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
  } as const,
} as const;

// 响应式断点
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1200,
  '2xl': 1536,
} as const;

// 导出样式类名
export const notificationClasses = {
  container: 'notification-page-container',
  header: 'notification-header',
  stats: 'notification-stats-grid',
  filter: 'notification-filter-bar',
  waterfall: 'notification-waterfall',
} as const;

// 生成 CSS 变量
export const getNotificationCSS = () => `
  /* ========== Notification 页面样式 ========== */

  /* ========== CSS 变量定义 ========== */

  /* 暗色主题变量 */
  [data-theme="dark"] {
    --notification-bg: rgba(26, 26, 26, 0.8);
    --notification-card-bg: rgba(26, 26, 26, 0.6);
    --notification-border: rgba(255, 255, 255, 0.08);
    --notification-text: rgba(255, 255, 255, 0.95);
    --notification-text-secondary: rgba(255, 255, 255, 0.55);
    --notification-text-tertiary: rgba(255, 255, 255, 0.4);
    --notification-hover: rgba(102, 126, 234, 0.15);
    --notification-glow: 0 0 20px rgba(102, 126, 234, 0.2);

    /* 统计卡片 */
    --notification-stat-bg: rgba(26, 26, 26, 0.6);
    --notification-stat-border: rgba(255, 255, 255, 0.08);

    /* 筛选栏 */
    --notification-filter-bg: rgba(26, 26, 26, 0.4);
    --notification-filter-border: rgba(255, 255, 255, 0.06);
    --notification-filter-active-bg: rgba(102, 126, 234, 0.15);
    --notification-filter-active-border: rgba(102, 126, 234, 0.3);
    --notification-filter-active-text: rgba(255, 255, 255, 0.95);
    --notification-filter-text: rgba(255, 255, 255, 0.55);
    --notification-filter-hover-bg: rgba(255, 255, 255, 0.05);

    /* Chips */
    --notification-chip-active-bg: rgba(102, 126, 234, 0.15);
    --notification-chip-active-border: rgba(102, 126, 234, 0.3);
    --notification-chip-active-text: rgba(255, 255, 255, 0.95);
    --notification-chip-border: rgba(255, 255, 255, 0.1);
    --notification-chip-text: rgba(255, 255, 255, 0.55);

    /* 通知卡片 */
    --notification-card-bg: rgba(26, 26, 26, 0.6);
    --notification-card-border: rgba(255, 255, 255, 0.06);
    --notification-card-unread-bg: rgba(102, 126, 234, 0.08);
    --notification-card-unread-border: rgba(102, 126, 234, 0.2);
    --notification-card-hover-border: rgba(102, 126, 234, 0.15);

    /* 区块头部 */
    --notification-section-header-bg: rgba(26, 26, 26, 0.4);
    --notification-section-header-border: rgba(255, 255, 255, 0.06);
    --notification-section-header-hover-bg: rgba(255, 255, 255, 0.03);

    /* Badge */
    --notification-badge-bg: #667eea;
    --notification-badge-inactive-bg: rgba(255, 255, 255, 0.2);

    /* 页面头部 */
    --notification-header-bg: rgba(26, 26, 26, 0.6);
    --notification-header-border: rgba(255, 255, 255, 0.08);
    --notification-header-icon-bg: rgba(102, 126, 234, 0.15);
    --notification-header-icon-color: #667eea;

    /* 批量操作栏 */
    --notification-bulk-bar-bg: rgba(102, 126, 234, 0.15);
    --notification-bulk-bar-border: rgba(102, 126, 234, 0.3);

    /* 展开区域 */
    --notification-expand-border: rgba(255, 255, 255, 0.06);

    /* 查看更多 */
    --notification-show-more-text: rgba(102, 126, 234, 0.85);
    --notification-show-more-bg: rgba(102, 126, 234, 0.05);
    --notification-show-more-border: rgba(102, 126, 234, 0.2);
    --notification-show-more-hover-bg: rgba(102, 126, 234, 0.1);
    --notification-show-more-hover-border: rgba(102, 126, 234, 0.3);
  }

  /* 亮色主题变量 */
  [data-theme="light"] {
    --notification-bg: #ffffff;
    --notification-card-bg: #ffffff;
    --notification-border: rgba(0, 0, 0, 0.08);
    --notification-text: #111111;
    --notification-text-secondary: rgba(0, 0, 0, 0.55);
    --notification-text-tertiary: rgba(0, 0, 0, 0.4);
    --notification-hover: rgba(102, 126, 234, 0.05);
    --notification-glow: 0 2px 8px rgba(0, 0, 0, 0.06);

    /* 统计卡片 */
    --notification-stat-bg: #ffffff;
    --notification-stat-border: rgba(0, 0, 0, 0.08);

    /* 筛选栏 */
    --notification-filter-bg: rgba(0, 0, 0, 0.02);
    --notification-filter-border: rgba(0, 0, 0, 0.06);
    --notification-filter-active-bg: rgba(102, 126, 234, 0.1);
    --notification-filter-active-border: rgba(102, 126, 234, 0.25);
    --notification-filter-active-text: #111;
    --notification-filter-text: rgba(0, 0, 0, 0.55);
    --notification-filter-hover-bg: rgba(0, 0, 0, 0.04);

    /* Chips */
    --notification-chip-active-bg: rgba(102, 126, 234, 0.1);
    --notification-chip-active-border: rgba(102, 126, 234, 0.25);
    --notification-chip-active-text: #111;
    --notification-chip-border: rgba(0, 0, 0, 0.1);
    --notification-chip-text: rgba(0, 0, 0, 0.55);

    /* 通知卡片 */
    --notification-card-bg: #ffffff;
    --notification-card-border: rgba(0, 0, 0, 0.06);
    --notification-card-unread-bg: rgba(102, 126, 234, 0.04);
    --notification-card-unread-border: rgba(102, 126, 234, 0.15);
    --notification-card-hover-border: rgba(102, 126, 234, 0.2);

    /* 区块头部 */
    --notification-section-header-bg: rgba(0, 0, 0, 0.02);
    --notification-section-header-border: rgba(0, 0, 0, 0.06);
    --notification-section-header-hover-bg: rgba(0, 0, 0, 0.04);

    /* Badge */
    --notification-badge-bg: #667eea;
    --notification-badge-inactive-bg: rgba(0, 0, 0, 0.15);

    /* 页面头部 */
    --notification-header-bg: #ffffff;
    --notification-header-border: rgba(0, 0, 0, 0.08);
    --notification-header-icon-bg: rgba(102, 126, 234, 0.1);
    --notification-header-icon-color: #667eea;

    /* 批量操作栏 */
    --notification-bulk-bar-bg: rgba(102, 126, 234, 0.1);
    --notification-bulk-bar-border: rgba(102, 126, 234, 0.25);

    /* 展开区域 */
    --notification-expand-border: rgba(0, 0, 0, 0.06);

    /* 查看更多 */
    --notification-show-more-text: #667eea;
    --notification-show-more-bg: rgba(102, 126, 234, 0.05);
    --notification-show-more-border: rgba(102, 126, 234, 0.15);
    --notification-show-more-hover-bg: rgba(102, 126, 234, 0.1);
    --notification-show-more-hover-border: rgba(102, 126, 234, 0.25);
  }

  /* ========== 容器 ========== */
  .notification-page-container {
    min-height: 100vh;
    animation: notificationPageFadeIn 0.4s ease-out;
  }

  @keyframes notificationPageFadeIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ========== 卡片入场动画 ========== */
  @keyframes notificationCardEnter {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .card-enter-wrapper {
    /* 动画通过内联样式控制 */
  }

  /* ========== 区块淡入动画 ========== */
  @keyframes sectionFadeIn {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ========== 扫除删除动画 ========== */
  @keyframes sweepRight {
    0% {
      transform: translateX(0) rotate(0deg);
      opacity: 1;
      max-height: 200px;
      margin-bottom: 12px;
    }
    30% {
      transform: translateX(20px) rotate(2deg);
    }
    100% {
      transform: translateX(120%) rotate(-5deg);
      opacity: 0;
      max-height: 0;
      margin-bottom: 0;
      padding-top: 0;
      padding-bottom: 0;
    }
  }

  .swipe-to-delete-wrapper.removing {
    animation: sweepRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    pointer-events: none;
  }

  .notification-card.removing {
    animation: sweepRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    pointer-events: none;
  }

  /* ========== 批量操作栏滑入动画 ========== */
  @keyframes bulkBarSlideUp {
    from {
      opacity: 0;
      transform: translateY(100%);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ========== 统计卡片样式 ========== */
  .notification-stat-card {
    position: relative;
    overflow: hidden;
  }

  .notification-stat-card:hover {
    /* 悬停效果通过内联样式控制 */
  }

  .notification-stat-card.active {
    box-shadow: var(--notification-glow);
  }

  .stat-card-trend {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 12px;
    font-weight: 500;
    margin-top: 4px;
  }

  /* ========== 通知卡片样式 ========== */
  .notification-card {
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .notification-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: inherit;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  [data-theme="dark"] .notification-card.unread::before {
    background: linear-gradient(135deg,
      rgba(102, 126, 234, 0.1) 0%,
      rgba(118, 75, 162, 0.05) 100%
    );
    opacity: 1;
  }

  [data-theme="light"] .notification-card.unread {
    box-shadow: 0 1px 4px rgba(102, 126, 234, 0.1);
  }

  .notification-card.expanded {
    /* 展开状态 */
  }

  .notification-card.expanded .expanded-content {
    max-height: 200px;
    opacity: 1;
  }

  .notification-card .expanded-content {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* ========== 类型筛选 Chips ========== */
  .type-filter-chips {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .type-filter-chips button {
    position: relative;
    overflow: hidden;
  }

  .type-filter-chips button::after {
    content: '';
    position: absolute;
    inset: 0;
    background: currentColor;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .type-filter-chips button:hover::after {
    opacity: 0.05;
  }

  /* ========== 状态筛选组 ========== */
  .status-filter-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-filter-group button {
    position: relative;
    overflow: hidden;
  }

  .status-filter-group button::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 2px;
    background: var(--notification-badge-bg);
    transition: all 0.3s ease;
    transform: translateX(-50%);
  }

  .status-filter-group button:hover::before {
    width: 60%;
  }

  /* ========== 区块头部 ========== */
  .section-header {
    user-select: none;
  }

  .section-header:hover .section-header-icon {
    transform: scale(1.05);
  }

  .section-header-icon {
    transition: transform 0.2s ease;
  }

  /* ========== 瀑布流布局 ========== */
  .notification-waterfall {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 24px;
    align-items: start;
  }

  /* ========== 空状态 ========== */
  .notification-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
    color: var(--notification-text-secondary);
  }

  .notification-empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  /* ========== 响应式设计 ========== */
  @media (max-width: 1199px) {
    .notification-waterfall {
      grid-template-columns: 1fr;
    }

    .notification-stats-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
  }

  @media (max-width: 768px) {
    .notification-page-container {
      padding: 24px 20px;
    }

    .notification-header {
      flex-direction: column;
      align-items: flex-start !important;
      gap: 16px;
    }

    .notification-header .ant-space {
      width: 100%;
      justify-content: flex-start;
    }

    .notification-stats-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 12px !important;
    }

    .notification-stat-card {
      padding: 16px 12px !important;
    }

    .stat-card-value {
      font-size: 20px !important;
    }

    .stat-card-title {
      font-size: 12px !important;
    }

    .notification-filter-bar {
      padding: 12px 16px !important;
    }

    .status-filter-group {
      flex-wrap: wrap;
    }

    .type-filter-chips {
      gap: 6px;
    }

    .type-filter-chips button {
      padding: 5px 10px !important;
      font-size: 12px !important;
    }

    .notification-waterfall {
      gap: 16px;
    }

    .notification-card {
      padding: 12px !important;
    }

    .section-header {
      padding: 10px 12px !important;
    }

    .bulk-action-bar {
      flex-direction: column;
      gap: 12px;
      padding: 12px 16px !important;
    }

    .bulk-action-bar .ant-space {
      width: 100%;
    }

    .bulk-action-bar .ant-space button {
      flex: 1;
    }
  }

  @media (max-width: 480px) {
    .notification-stats-grid {
      grid-template-columns: 1fr !important;
    }

    .notification-header {
      padding: 16px !important;
    }

    .notification-header h2 {
      font-size: 18px !important;
    }

    .notification-header .ant-btn {
      font-size: 13px;
      padding: 4px 12px;
    }

    .type-filter-chips {
      flex-direction: column;
      align-items: flex-start;
    }

    .type-filter-chips span:first-child {
      margin-bottom: 4px;
    }
  }

  /* ========== 减少动画模式 ========== */
  @media (prefers-reduced-motion: reduce) {
    .notification-page-container,
    .card-enter-wrapper,
    .notification-card,
    .notification-stat-card,
    .section-header,
    .bulk-action-bar,
    .swipe-to-delete-wrapper {
      animation: none !important;
      transition: none !important;
    }

    .notification-card.expanded .expanded-content {
      transition: none !important;
    }

    .collapse-section-wrapper {
      transition: none !important;
    }
  }
`;

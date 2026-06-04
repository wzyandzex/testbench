/**
 * Settings 页面样式常量和 CSS
 * 支持暗色/亮色双主题
 */

// 样式常量
export const settingsPageStyle = {
  container: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '32px 48px',
  } as const,

  containerMobile: {
    padding: '24px 20px',
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
export const settingsClasses = {
  container: 'settings-page-container',
  banner: 'settings-user-banner',
  tabs: 'settings-tabs',
  group: 'settings-group',
  item: 'settings-item',
} as const;

// 生成 CSS 变量
export const getSettingsCSS = () => `
  /* ========== Settings 页面样式 ========== */

  /* ========== 容器 ========== */
  .settings-page-container {
    min-height: 100vh;
    animation: settings-fade-in 0.4s ease-out;
  }

  @keyframes settings-fade-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ========== 用户横幅卡片 ========== */
  .settings-user-banner {
    position: relative;
    border-radius: 20px;
    padding: 32px;
    margin-bottom: 32px;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* 暗色主题横幅 */
  [data-theme="dark"] .settings-user-banner {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  }

  /* 亮色主题横幅 */
  [data-theme="light"] .settings-user-banner {
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  }

  /* 装饰性光球 */
  .settings-banner-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.4;
    pointer-events: none;
    animation: settings-orb-float 15s ease-in-out infinite;
  }

  [data-theme="light"] .settings-banner-orb {
    display: none;
  }

  .settings-banner-orb-1 {
    width: 200px;
    height: 200px;
    background: #f093fb;
    top: -50px;
    right: -50px;
    animation-delay: 0s;
  }

  .settings-banner-orb-2 {
    width: 150px;
    height: 150px;
    background: #667eea;
    bottom: -30px;
    left: 20%;
    animation-delay: -5s;
  }

  .settings-banner-orb-3 {
    width: 100px;
    height: 100px;
    background: #764ba2;
    top: 50%;
    right: 15%;
    animation-delay: -10s;
  }

  @keyframes settings-orb-float {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(20px, -20px) scale(1.05); }
    66% { transform: translate(-15px, 15px) scale(0.95); }
  }

  /* 横幅内容 */
  .settings-banner-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .settings-banner-avatar {
    flex-shrink: 0;
    border: 3px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  [data-theme="light"] .settings-banner-avatar {
    border-color: rgba(0, 0, 0, 0.08);
  }

  .settings-banner-info {
    flex: 1;
    min-width: 0;
  }

  .settings-banner-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 4px;
  }

  .settings-banner-username {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  [data-theme="dark"] .settings-banner-username {
    color: #fff;
  }

  [data-theme="light"] .settings-banner-username {
    color: #111;
  }

  .settings-banner-edit-btn {
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    padding: 4px 12px;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  [data-theme="light"] .settings-banner-edit-btn {
    color: rgba(0, 0, 0, 0.6);
  }

  .settings-banner-edit-btn:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  [data-theme="light"] .settings-banner-edit-btn:hover {
    background: rgba(0, 0, 0, 0.06);
  }

  .settings-banner-email {
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 500;
  }

  [data-theme="dark"] .settings-banner-email {
    color: rgba(255, 255, 255, 0.75);
  }

  [data-theme="light"] .settings-banner-email {
    color: rgba(0, 0, 0, 0.6);
  }

  .settings-banner-bio {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
  }

  [data-theme="dark"] .settings-banner-bio {
    color: rgba(255, 255, 255, 0.55);
  }

  [data-theme="light"] .settings-banner-bio {
    color: rgba(0, 0, 0, 0.45);
  }

  /* ========== Tabs 导航 ========== */
  .settings-tabs {
    position: relative;
    margin-bottom: 32px;
    border-bottom: 1px solid;
    transition: border-color 0.3s ease;
  }

  [data-theme="dark"] .settings-tabs {
    border-color: rgba(255, 255, 255, 0.1);
  }

  [data-theme="light"] .settings-tabs {
    border-color: rgba(0, 0, 0, 0.08);
  }

  .settings-tabs-list {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding: 0 4px;
  }

  .settings-tabs-list::-webkit-scrollbar {
    display: none;
  }

  .settings-tab {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 500;
    background: transparent;
    border: none;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 10px 10px 0 0;
  }

  [data-theme="dark"] .settings-tab {
    color: rgba(255, 255, 255, 0.55);
  }

  [data-theme="light"] .settings-tab {
    color: rgba(0, 0, 0, 0.5);
  }

  .settings-tab:hover {
    background: rgba(102, 126, 234, 0.08);
  }

  [data-theme="light"] .settings-tab:hover {
    background: rgba(102, 126, 234, 0.06);
  }

  .settings-tab-active {
    font-weight: 600;
  }

  [data-theme="dark"] .settings-tab-active {
    color: rgba(255, 255, 255, 0.95);
  }

  [data-theme="light"] .settings-tab-active {
    color: #111;
  }

  .settings-tab-icon {
    font-size: 16px;
  }

  /* Tab 下划线指示器 */
  .settings-tab-indicator {
    position: absolute;
    bottom: -1px;
    left: 0;
    height: 2px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  [data-theme="dark"] .settings-tab-indicator {
    background: linear-gradient(90deg, #667eea, #764ba2);
    box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
  }

  [data-theme="light"] .settings-tab-indicator {
    background: #667eea;
  }

  /* ========== 设置分组 ========== */
  .settings-group {
    background: transparent;
    border-radius: 16px;
    margin-bottom: 24px;
    animation: settings-group-fade-in 0.3s ease-out backwards;
  }

  @keyframes settings-group-fade-in {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .settings-group-header {
    padding: 16px 0;
    margin-bottom: 8px;
  }

  .settings-group-title {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  [data-theme="dark"] .settings-group-title {
    color: rgba(255, 255, 255, 0.95);
  }

  [data-theme="light"] .settings-group-title {
    color: #111;
  }

  .settings-group-description {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
  }

  [data-theme="dark"] .settings-group-description {
    color: rgba(255, 255, 255, 0.45);
  }

  [data-theme="light"] .settings-group-description {
    color: rgba(0, 0, 0, 0.45);
  }

  .settings-group-content {
    background: transparent;
    border-radius: 12px;
    overflow: hidden;
  }

  /* ========== 设置项 ========== */
  .settings-item {
    padding: 16px 20px;
    border-bottom: 1px solid;
    transition: all 0.2s ease;
  }

  .settings-item:last-child {
    border-bottom: none;
  }

  [data-theme="dark"] .settings-item {
    background: rgba(26, 26, 26, 0.6);
    border-color: rgba(255, 255, 255, 0.06);
  }

  [data-theme="light"] .settings-item {
    background: #fff;
    border-color: rgba(0, 0, 0, 0.06);
  }

  .settings-item:hover:not(.settings-item-disabled) {
    [data-theme="dark"] & {
      background: rgba(26, 26, 26, 0.8);
      border-color: rgba(102, 126, 234, 0.2);
    }
    [data-theme="light"] & {
      background: #fafafa;
      border-color: rgba(102, 126, 234, 0.15);
    }
  }

  .settings-item-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .settings-item-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .settings-item-label-section {
    flex: 1;
    min-width: 0;
  }

  .settings-item-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 2px;
  }

  [data-theme="dark"] .settings-item-label {
    color: rgba(255, 255, 255, 0.9);
  }

  [data-theme="light"] .settings-item-label {
    color: #111;
  }

  .settings-item-description {
    display: block;
    font-size: 12px;
    line-height: 1.4;
  }

  [data-theme="dark"] .settings-item-description {
    color: rgba(255, 255, 255, 0.45);
  }

  [data-theme="light"] .settings-item-description {
    color: rgba(0, 0, 0, 0.45);
  }

  .settings-item-control {
    flex-shrink: 0;
  }

  /* ========== 输入框样式 ========== */
  .settings-item-input,
  .settings-item-select,
  .settings-item-textarea {
    padding: 8px 14px;
    font-size: 14px;
    border-radius: 8px;
    border: 1px solid;
    background: transparent;
    transition: all 0.2s ease;
    font-family: inherit;
    min-width: 200px;
  }

  [data-theme="dark"] .settings-item-input,
  [data-theme="dark"] .settings-item-select,
  [data-theme="dark"] .settings-item-textarea {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.9);
  }

  [data-theme="dark"] .settings-item-input::placeholder,
  [data-theme="dark"] .settings-item-textarea::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  [data-theme="light"] .settings-item-input,
  [data-theme="light"] .settings-item-select,
  [data-theme="light"] .settings-item-textarea {
    background: #fff;
    border-color: rgba(0, 0, 0, 0.12);
    color: #111;
  }

  [data-theme="light"] .settings-item-input::placeholder,
  [data-theme="light"] .settings-item-textarea::placeholder {
    color: rgba(0, 0, 0, 0.3);
  }

  .settings-item-input:focus,
  .settings-item-select:focus,
  .settings-item-textarea:focus {
    outline: none;
    border-color: #667eea;
  }

  [data-theme="dark"] .settings-item-input:focus,
  [data-theme="dark"] .settings-item-select:focus,
  [data-theme="dark"] .settings-item-textarea:focus {
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
  }

  [data-theme="light"] .settings-item-input:focus,
  [data-theme="light"] .settings-item-select:focus,
  [data-theme="light"] .settings-item-textarea:focus {
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .settings-item-textarea {
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
  }

  /* ========== Switch 开关样式 ========== */
  .settings-switch {
    position: relative;
    display: inline-flex;
    align-items: center;
    border: none;
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: transparent;
    padding: 0;
  }

  [data-theme="dark"] .settings-switch {
    background: rgba(255, 255, 255, 0.1);
  }

  [data-theme="light"] .settings-switch {
    background: rgba(0, 0, 0, 0.15);
  }

  .settings-switch-checked {
    background: #667eea !important;
  }

  [data-theme="dark"] .settings-switch-checked {
    box-shadow: 0 0 12px rgba(102, 126, 234, 0.4);
  }

  .settings-switch-dot {
    position: absolute;
    left: 0;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .settings-switch:hover:not(.settings-switch-disabled) {
    [data-theme="dark"] & {
      background: rgba(255, 255, 255, 0.15);
    }
    [data-theme="light"] & {
      background: rgba(0, 0, 0, 0.2);
    }
  }

  .settings-switch-checked:hover:not(.settings-switch-disabled) {
    background: #7b94f2 !important;
  }

  .settings-switch-disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* ========== Radio 卡片样式 ========== */
  .settings-item-radios {
    display: flex;
    gap: 12px;
  }

  .settings-item-radio {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 12px 16px;
    border: 1px solid;
    border-radius: 10px;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 120px;
  }

  [data-theme="dark"] .settings-item-radio {
    border-color: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.65);
  }

  [data-theme="light"] .settings-item-radio {
    border-color: rgba(0, 0, 0, 0.1);
    color: rgba(0, 0, 0, 0.65);
  }

  .settings-item-radio:hover:not(:disabled) {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.05);
  }

  .settings-item-radio-active {
    border-color: #667eea !important;
    background: rgba(102, 126, 234, 0.1) !important;
  }

  [data-theme="dark"] .settings-item-radio-active {
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  }

  .settings-item-radio-label {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 2px;
  }

  .settings-item-radio-desc {
    font-size: 12px;
    opacity: 0.7;
  }

  /* ========== 响应式设计 ========== */
  @media (max-width: 768px) {
    .settings-page-container {
      padding: 24px 20px;
    }

    .settings-user-banner {
      padding: 24px;
      border-radius: 16px;
    }

    .settings-banner-content {
      flex-direction: column;
      text-align: center;
    }

    .settings-banner-header {
      flex-direction: column;
      gap: 12px;
    }

    .settings-banner-avatar {
      align-self: center;
    }

    .settings-tabs-list {
      gap: 4px;
      padding: 0 8px;
    }

    .settings-tab {
      padding: 10px 16px;
      font-size: 13px;
    }

    .settings-item {
      padding: 14px 16px;
    }

    .settings-item-main {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .settings-item-control {
      width: 100%;
    }

    .settings-item-input,
    .settings-item-select {
      width: 100%;
      min-width: unset;
    }

    .settings-item-radios {
      flex-direction: column;
      width: 100%;
    }

    .settings-item-radio {
      width: 100%;
      min-width: unset;
    }

    .settings-banner-orb {
      display: none;
    }
  }

  @media (max-width: 480px) {
    .settings-banner-username {
      font-size: 20px;
    }

    .settings-banner-avatar {
      width: 56px !important;
      height: 56px !important;
    }
  }

  /* ========== 通知时间轴样式 ========== */
  .notification-timeline {
    position: relative;
    padding-left: 32px;
  }

  /* 时间轴线 */
  .notification-timeline::before {
    content: '';
    position: absolute;
    left: 7px;
    top: 8px;
    bottom: 8px;
    width: 2px;
    transition: all 0.3s ease;
  }

  [data-theme="dark"] .notification-timeline::before {
    background: linear-gradient(180deg,
      rgba(102, 126, 234, 0.6) 0%,
      rgba(102, 126, 234, 0.2) 50%,
      rgba(102, 126, 234, 0.6) 100%
    );
    box-shadow: 0 0 8px rgba(102, 126, 234, 0.3);
  }

  [data-theme="light"] .notification-timeline::before {
    background: linear-gradient(180deg,
      rgba(0, 0, 0, 0.12) 0%,
      rgba(0, 0, 0, 0.06) 50%,
      rgba(0, 0, 0, 0.12) 100%
    );
  }

  /* 时间轴项 */
  .notification-timeline-item {
    position: relative;
    padding: 16px 20px;
    margin-bottom: 8px;
    border-radius: 12px;
    display: flex;
    gap: 16px;
    align-items: flex-start;
    cursor: default;
    opacity: 0;
    animation: notification-timeline-slide-in 0.4s ease-out forwards;
    animation-delay: calc(var(--timeline-index, 0) * 0.1s);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes notification-timeline-slide-in {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  [data-theme="dark"] .notification-timeline-item {
    background: rgba(26, 26, 26, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  [data-theme="light"] .notification-timeline-item {
    background: #fff;
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .notification-timeline-item:hover:not(.notification-timeline-item-disabled) {
    [data-theme="dark"] & {
      background: rgba(26, 26, 26, 0.8);
      border-color: rgba(102, 126, 234, 0.2);
      box-shadow: 0 0 20px rgba(102, 126, 234, 0.1);
      transform: translateX(4px);
    }
    [data-theme="light"] & {
      background: #fafafa;
      border-color: rgba(102, 126, 234, 0.15);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transform: translateX(4px);
    }
  }

  .notification-timeline-item-disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* 时间轴节点 */
  .notification-timeline-dot {
    position: absolute;
    left: -28px;
    top: 20px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }

  [data-theme="dark"] .notification-timeline-dot {
    background: rgba(102, 126, 234, 0.2);
    border: 2px solid rgba(102, 126, 234, 0.6);
    box-shadow: 0 0 12px rgba(102, 126, 234, 0.4);
  }

  [data-theme="light"] .notification-timeline-dot {
    background: #fff;
    border: 2px solid rgba(0, 0, 0, 0.15);
  }

  .notification-timeline-item:hover .notification-timeline-dot {
    [data-theme="dark"] & {
      box-shadow: 0 0 16px rgba(102, 126, 234, 0.6);
      transform: scale(1.1);
    }
    [data-theme="light"] & {
      border-color: #667eea;
      transform: scale(1.1);
    }
  }

  .notification-timeline-dot-inner {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  [data-theme="dark"] .notification-timeline-dot-inner {
    background: #667eea;
  }

  [data-theme="light"] .notification-timeline-dot-inner {
    background: #667eea;
  }

  /* 时间轴内容 */
  .notification-timeline-content {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .notification-timeline-icon {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: all 0.3s ease;
  }

  [data-theme="dark"] .notification-timeline-icon {
    background: rgba(102, 126, 234, 0.15);
    color: rgba(255, 255, 255, 0.8);
  }

  [data-theme="light"] .notification-timeline-icon {
    background: rgba(102, 126, 234, 0.08);
    color: #667eea;
  }

  .notification-timeline-item:hover .notification-timeline-icon {
    [data-theme="dark"] & {
      background: rgba(102, 126, 234, 0.25);
    }
    [data-theme="light"] & {
      background: rgba(102, 126, 234, 0.15);
    }
  }

  .notification-timeline-info {
    flex: 1;
    min-width: 0;
  }

  .notification-timeline-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 4px;
  }

  .notification-timeline-label {
    font-size: 14px;
    font-weight: 500;
  }

  [data-theme="dark"] .notification-timeline-label {
    color: rgba(255, 255, 255, 0.9);
  }

  [data-theme="light"] .notification-timeline-label {
    color: #111;
  }

  .notification-timeline-description {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
  }

  [data-theme="dark"] .notification-timeline-description {
    color: rgba(255, 255, 255, 0.45);
  }

  [data-theme="light"] .notification-timeline-description {
    color: rgba(0, 0, 0, 0.5);
  }

  /* 通知预览卡片 */
  .notification-preview {
    position: absolute;
    right: calc(100% + 16px);
    top: 50%;
    transform: translateY(-50%);
    z-index: 100;
    pointer-events: none;
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .notification-timeline-item-hovered .notification-preview {
    opacity: 1;
    transform: translateY(-50%) translateX(-8px);
    pointer-events: auto;
  }

  .notification-preview-content {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 10px;
    min-width: 240px;
    max-width: 320px;
    backdrop-filter: blur(20px);
    background: var(--notification-bg, rgba(102, 126, 234, 0.1));
    border: 1px solid var(--notification-border-color, rgba(102, 126, 234, 0.3));
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    transform-style: preserve-3d;
    transition: all 0.3s ease;
  }

  [data-theme="light"] .notification-preview-content {
    background: #fff;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  }

  .notification-preview-icon {
    flex-shrink: 0;
    font-size: 18px;
    color: var(--notification-icon-color, #667eea);
  }

  .notification-preview-body {
    flex: 1;
    min-width: 0;
  }

  .notification-preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 4px;
  }

  .notification-preview-title {
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  [data-theme="dark"] .notification-preview-title {
    color: rgba(255, 255, 255, 0.95);
  }

  [data-theme="light"] .notification-preview-title {
    color: #111;
  }

  .notification-preview-time {
    font-size: 11px;
    white-space: nowrap;
  }

  [data-theme="dark"] .notification-preview-time {
    color: rgba(255, 255, 255, 0.4);
  }

  [data-theme="light"] .notification-preview-time {
    color: rgba(0, 0, 0, 0.4);
  }

  .notification-preview-message {
    margin: 0;
    font-size: 12px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  [data-theme="dark"] .notification-preview-message {
    color: rgba(255, 255, 255, 0.65);
  }

  [data-theme="light"] .notification-preview-message {
    color: rgba(0, 0, 0, 0.65);
  }

  /* 3D 光泽效果 */
  .notification-preview-shine {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 50%,
      rgba(255, 255, 255, 0.05) 100%
    );
    border-radius: 10px;
    pointer-events: none;
  }

  /* 暗色主题下开关脉冲动画 */
  @keyframes notification-switch-pulse {
    0%, 100% {
      box-shadow: 0 0 12px rgba(102, 126, 234, 0.4);
    }
    50% {
      box-shadow: 0 0 20px rgba(102, 126, 234, 0.7);
    }
  }

  [data-theme="dark"] .settings-switch-checked {
    animation: notification-switch-pulse 2s ease-in-out infinite;
  }

  /* 时间轴响应式 */
  @media (max-width: 768px) {
    .notification-timeline {
      padding-left: 24px;
    }

    .notification-timeline::before {
      left: 5px;
    }

    .notification-timeline-dot {
      left: -20px;
      top: 16px;
      width: 12px;
      height: 12px;
    }

    .notification-timeline-dot-inner {
      width: 4px;
      height: 4px;
    }

    .notification-timeline-content {
      flex-direction: column;
      align-items: flex-start;
    }

    .notification-timeline-label-row {
      width: 100%;
    }

    /* 移动端预览卡片在下方显示 */
    .notification-preview {
      position: relative;
      right: auto;
      top: auto;
      transform: none;
      margin-top: 12px;
      opacity: 1;
    }

    .notification-timeline-item-hovered .notification-preview {
      transform: none;
    }

    .notification-preview-content {
      min-width: unset;
      width: 100%;
    }
  }

  /* ========== 减少动画模式 ========== */
  @media (prefers-reduced-motion: reduce) {
    .settings-page-container,
    .settings-group,
    .settings-tab,
    .settings-item,
    .settings-switch,
    .settings-banner-orb,
    .settings-tab-indicator,
    .settings-switch-dot,
    .notification-timeline-item,
    .notification-preview,
    .notification-preview-content {
      animation: none !important;
      transition: none !important;
    }
  }
`;

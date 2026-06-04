/**
 * 应用配置
 */
export const APP_CONFIG = {
  // 应用名称
  APP_NAME: 'MyAgent',

  // API 版本
  API_VERSION: 'v1',

  // 分页默认配置
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],

  // 请求超时时间 (ms)
  REQUEST_TIMEOUT: 30000,

  // 文件上传大小限制 (MB)
  MAX_UPLOAD_SIZE: 10,

  // WebSocket 心跳间隔 (ms)
  WS_HEARTBEAT_INTERVAL: 30000,

  // WebSocket 重连间隔 (ms)
  WS_RECONNECT_INTERVAL: 3000,

  // WebSocket 最大重连次数
  WS_MAX_RECONNECT_ATTEMPTS: 10,

  // Token 刷新提前量 (ms)
  TOKEN_REFRESH_ADVANCE: 5 * 60 * 1000,
} as const;

/**
 * 本地存储键名
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  LANGUAGE: 'language',
  THEME: 'theme',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  CURRENT_ORG_ID: 'current_org_id',
} as const;

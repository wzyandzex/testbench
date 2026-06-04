/**
 * Organizations 页面主题配置
 * 浅色模式：简洁专业风格
 * 深色模式：赛博科技指挥台风格 - 深邃、霓虹、动态
 */

export interface OrgTheme {
  // 页面背景
  background: string;
  // 卡片背景
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  cardHoverShadow: string;
  // 文字颜色
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  // 计划类型颜色
  enterpriseColor: string;
  professionalColor: string;
  teamColor: string;
  freeColor: string;
  // 角色颜色
  ownerColor: string;
  adminColor: string;
  memberColor: string;
  // 状态颜色
  statusActive: string;
  statusActiveBg: string;
  statusWarning: string;
  statusWarningBg: string;
  // 强调色
  neonCyan: string;
  neonPurple: string;
  neonGreen: string;
  neonRed: string;
  neonOrange: string;
  // 边框
  border: string;
  borderLight: string;
  // 渐变
  gradientPrimary: string;
  // 霓虹效果 (深色模式)
  neonBorder?: string;
  glow?: string;
  // 网格纹理 (深色模式)
  gridPattern?: string;
}

export const ORG_THEME: Record<'light' | 'dark', OrgTheme> = {
  // ==================== 浅色模式 - 简洁专业 ====================
  light: {
    // 页面背景 - 纯白
    background: '#ffffff',

    // 卡片背景 - 纯白
    cardBg: '#ffffff',
    cardBorder: 'rgba(0,0,0,0.06)',
    cardShadow: '0 1px 2px rgba(0,0,0,0.05)',
    cardHoverShadow: '0 4px 12px rgba(0,0,0,0.1)',

    // 文字颜色
    textPrimary: '#1a1a2e',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',

    // 计划类型颜色 - 保持原样
    enterpriseColor: '#7c3aed',
    professionalColor: '#1677ff',
    teamColor: '#10b981',
    freeColor: '#9ca3af',

    // 角色颜色
    ownerColor: '#f59e0b',
    adminColor: '#1677ff',
    memberColor: '#10b981',

    // 状态颜色
    statusActive: '#10b981',
    statusActiveBg: 'rgba(16, 185, 129, 0.1)',
    statusWarning: '#f59e0b',
    statusWarningBg: 'rgba(245, 158, 11, 0.1)',

    // 强调色
    neonCyan: '#1677ff',
    neonPurple: '#7c3aed',
    neonGreen: '#10b981',
    neonRed: '#ef4444',
    neonOrange: '#f59e0b',

    // 边框
    border: 'rgba(0,0,0,0.08)',
    borderLight: 'rgba(0,0,0,0.04)',

    // 渐变
    gradientPrimary: 'linear-gradient(135deg, #1677ff 0%, #7c3aed 100%)',
  },

  // ==================== 深色模式 - 赛博指挥台 ====================
  dark: {
    // 页面背景 - 深邃空间
    background: '#0a0a0f',

    // 卡片背景 - 深灰带微蓝
    cardBg: '#141419',
    cardBorder: 'rgba(0, 212, 255, 0.2)',
    cardShadow: '0 4px 20px rgba(0, 212, 255, 0.1)',
    cardHoverShadow: '0 8px 30px rgba(0, 212, 255, 0.2), 0 0 40px rgba(124, 58, 237, 0.1)',

    // 文字颜色
    textPrimary: '#e5e7eb',
    textSecondary: '#9ca3af',
    textTertiary: '#6b7280',

    // 计划类型颜色 - 霓虹效果
    enterpriseColor: '#a78bfa',
    professionalColor: '#00d4ff',
    teamColor: '#00ffaa',
    freeColor: '#6b7280',

    // 角色颜色 - 霓虹效果
    ownerColor: '#ff9500',
    adminColor: '#00d4ff',
    memberColor: '#6b7280',

    // 状态颜色 - 霓虹效果
    statusActive: '#00ffaa',
    statusActiveBg: 'rgba(0, 255, 170, 0.15)',
    statusWarning: '#ff9500',
    statusWarningBg: 'rgba(255, 149, 0, 0.15)',

    // 强调色 - 霓虹色系
    neonCyan: '#00d4ff',
    neonPurple: '#7c3aed',
    neonGreen: '#00ffaa',
    neonRed: '#ff4466',
    neonOrange: '#ff9500',

    // 边框
    border: 'rgba(255,255,255,0.1)',
    borderLight: 'rgba(255,255,255,0.05)',

    // 渐变 - 赛博朋克风
    gradientPrimary: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',

    // 霓虹边框
    neonBorder: 'rgba(0, 212, 255, 0.5)',

    // 辉光效果
    glow: '0 0 20px rgba(0, 212, 255, 0.3)',

    // 网格纹理
    gridPattern: 'linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)',
  },
};

// 计划配置
export const PLAN_CONFIG = {
  enterprise: {
    color: '#7c3aed',
    darkColor: '#a78bfa',
    icon: '👑',
    text: '企业版',
  },
  professional: {
    color: '#1677ff',
    darkColor: '#00d4ff',
    icon: '🚀',
    text: '专业版',
  },
  team: {
    color: '#10b981',
    darkColor: '#00ffaa',
    icon: '👥',
    text: '团队版',
  },
  free: {
    color: '#9ca3af',
    darkColor: '#6b7280',
    icon: '👤',
    text: '免费版',
  },
} as const;

// 角色配置
export const ROLE_CONFIG = {
  owner: {
    color: '#f59e0b',
    darkColor: '#ff9500',
    icon: '👑',
    text: '所有者',
  },
  admin: {
    color: '#1677ff',
    darkColor: '#00d4ff',
    icon: '🛡️',
    text: '管理员',
  },
  member: {
    color: '#10b981',
    darkColor: '#6b7280',
    icon: '👤',
    text: '成员',
  },
} as const;

export type PlanType = keyof typeof PLAN_CONFIG;
export type RoleType = keyof typeof ROLE_CONFIG;

// 统计卡片配置
export const STAT_CONFIG = [
  {
    key: 'total',
    label: '组织总数',
    icon: '🏢',
    color: '#00d4ff',
    darkColor: '#00d4ff',
  },
  {
    key: 'members',
    label: '总成员数',
    icon: '👥',
    color: '#1677ff',
    darkColor: '#00d4ff',
  },
  {
    key: 'agents',
    label: 'Agent 数量',
    icon: '🤖',
    color: '#10b981',
    darkColor: '#00ffaa',
  },
  {
    key: 'executions',
    label: '总执行次数',
    icon: '⚡',
    color: '#f59e0b',
    darkColor: '#ff9500',
  },
] as const;

// 获取主题样式的辅助函数
export const getOrgThemeStyle = (isDark: boolean): OrgTheme =>
  isDark ? ORG_THEME.dark : ORG_THEME.light;

// 导出动画 keyframes (用于在组件中注入)
export const ANIMATIONS = {
  shimmer: `
    @keyframes shimmer {
      0% { transform: translateX(-100%) rotate(45deg); }
      100% { transform: translateX(200%) rotate(45deg); }
    }
  `,
  float: `
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-5px); }
    }
  `,
  glowPulse: `
    @keyframes glowPulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
  `,
  neonPulse: `
    @keyframes neonPulse {
      0%, 100% {
        box-shadow: 0 0 5px currentColor, 0 0 10px currentColor;
      }
      50% {
        box-shadow: 0 0 15px currentColor, 0 0 25px currentColor, 0 0 35px currentColor;
      }
    }
  `,
  borderFlow: `
    @keyframes borderFlow {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `,
} as const;

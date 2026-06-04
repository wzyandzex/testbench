import { ThemeConfig } from 'antd';

/**
 * 现代简约风格主题配置
 * 轻量、简洁、现代，类似 Vercel 风格，适合科技公司/创业团队
 */
export const modernTheme: ThemeConfig = {
  token: {
    // 主色 - 黑白为主
    colorPrimary: '#000000',
    colorPrimaryHover: '#333333',
    colorPrimaryActive: '#000000',
    colorPrimaryBg: '#f5f5f5',

    // 辅助色 - 纯白
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#fafafa',

    // 强调色 - 蓝紫（用于 Info）
    colorInfo: '#667eea',

    // 功能色 - 使用更柔和的颜色
    colorSuccess: '#10b981',
    colorSuccessBg: '#d1fae5',
    colorSuccessBorder: '#6ee7b7',

    colorWarning: '#f59e0b',
    colorWarningBg: '#fef3c7',
    colorWarningBorder: '#fcd34d',

    colorError: '#ef4444',
    colorErrorBg: '#fee2e2',
    colorErrorBorder: '#fca5a5',

    // 中性色
    colorText: '#111111',
    colorTextSecondary: '#666666',
    colorTextTertiary: '#999999',
    colorTextDisabled: '#d4d4d4',

    colorBorder: '#eaeaea',
    colorBorderSecondary: '#f5f5f5',

    // 圆角 - 更大的圆角
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 4,
    borderRadiusOuter: 16,

    // 字体 - 稍小更精致
    fontSize: 14,
    fontSizeSM: 12,
    fontSizeLG: 16,
    fontSizeXL: 18,

    // 间距 - 更宽松的间距
    marginXS: 8,
    marginSM: 12,
    margin: 20,
    marginMD: 24,
    marginLG: 32,
    marginXL: 48,
  },
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
      // 主按钮使用黑色
      colorPrimary: '#000000',
      defaultBg: '#ffffff',
      defaultBorderColor: '#eaeaea',
      defaultHoverBorderColor: '#000000',
    },
    Input: {
      borderRadius: 8,
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
      activeBorderColor: '#000000',
      hoverBorderColor: '#000000',
    },
    Select: {
      borderRadius: 8,
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
    },
    Card: {
      borderRadiusLG: 12,
      boxShadowTertiary: '0 1px 2px rgba(0, 0, 0, 0.05)',
    },
    Table: {
      borderRadiusLG: 12,
      headerBg: '#fafafa',
      headerColor: '#111111',
    },
    Modal: {
      borderRadiusLG: 12,
    },
    Tabs: {
      itemActiveColor: '#000000',
      itemSelectedColor: '#000000',
    },
  },
};

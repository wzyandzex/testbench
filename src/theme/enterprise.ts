import { ThemeConfig } from 'antd';

/**
 * 企业级风格主题配置
 * 严肃、专业、可信赖，适合 B 端企业内部使用
 */
export const enterpriseTheme: ThemeConfig = {
  token: {
    // 主色 - 深蓝
    colorPrimary: '#1677ff',
    colorPrimaryHover: '#4096ff',
    colorPrimaryActive: '#0958d9',
    colorPrimaryBg: '#e6f4ff',

    // 辅助色 - 蓝紫
    colorInfo: '#722ed1',

    // 功能色
    colorSuccess: '#52c41a',
    colorSuccessHover: '#73d13d',
    colorSuccessActive: '#389e0d',
    colorSuccessBg: '#f6ffed',
    colorSuccessBorder: '#b7eb8f',

    colorWarning: '#faad14',
    colorWarningHover: '#ffc53d',
    colorWarningActive: '#d48806',
    colorWarningBg: '#fffbe6',
    colorWarningBorder: '#ffe58f',

    colorError: '#ff4d4f',
    colorErrorHover: '#ff7875',
    colorErrorActive: '#d9363e',
    colorErrorBg: '#fff2f0',
    colorErrorBorder: '#ffccc7',

    // 中性色
    colorText: 'rgba(0, 0, 0, 0.88)',
    colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
    colorTextTertiary: 'rgba(0, 0, 0, 0.45)',
    colorTextDisabled: 'rgba(0, 0, 0, 0.25)',

    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f5f5f5',

    colorBorder: '#d9d9d9',
    colorBorderSecondary: '#f0f0f0',

    // 圆角
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,

    // 字体
    fontSize: 14,
    fontSizeSM: 12,
    fontSizeLG: 16,
    fontSizeXL: 20,

    // 间距
    marginXS: 8,
    marginSM: 12,
    margin: 16,
    marginMD: 20,
    marginLG: 24,
    marginXL: 32,
  },
  components: {
    Button: {
      borderRadius: 6,
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
    },
    Input: {
      borderRadius: 6,
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
    },
    Select: {
      borderRadius: 6,
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
    },
    Card: {
      borderRadiusLG: 8,
    },
    Table: {
      borderRadiusLG: 8,
    },
    Modal: {
      borderRadiusLG: 8,
    },
  },
};

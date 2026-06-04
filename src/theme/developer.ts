import { ThemeConfig } from 'antd';

/**
 * 开发者工具风格主题配置
 * 功能至上、高信息密度、暗色友好，类似 GitHub/GitLab 风格
 */
export const developerTheme: ThemeConfig = {
  token: {
    // 主色 - 深蓝绿 (GitHub 风格)
    colorPrimary: '#0969da',
    colorPrimaryHover: '#0757b3',
    colorPrimaryActive: '#044289',
    colorPrimaryBg: '#ddf4ff',
    colorPrimaryBorder: '#54aeff',

    // 辅助色 - 紫色
    colorInfo: '#8250df',

    // 功能色 (GitHub 风格)
    colorSuccess: '#1f883d',
    colorSuccessBg: '#dafbe1',
    colorSuccessBorder: '#3fb950',
    colorSuccessHover: '#1a7f37',

    colorWarning: '#9a6700',
    colorWarningBg: '#fff8c5',
    colorWarningBorder: '#d29922',

    colorError: '#cf222e',
    colorErrorBg: '#ffebe9',
    colorErrorBorder: '#ff7b72',
    colorErrorHover: '#cf222e',

    // 中性色 (GitHub 风格)
    colorText: '#24292f',
    colorTextSecondary: '#57606a',
    colorTextTertiary: '#8b949e',
    colorTextDisabled: '#d0d7de',

    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f6f8fa',

    colorBorder: '#d0d7de',
    colorBorderSecondary: '#eaeef2',

    // 圆角 - 较小，更实用
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    borderRadiusXS: 3,

    // 字体 - 稍小，高信息密度
    fontSize: 14,
    fontSizeSM: 12,
    fontSizeLG: 16,
    fontSizeXL: 18,

    // 间距 - 更紧凑
    marginXS: 4,
    marginSM: 8,
    margin: 12,
    marginMD: 16,
    marginLG: 20,
    marginXL: 24,
  },
  components: {
    Button: {
      borderRadius: 6,
      controlHeight: 32,
      controlHeightLG: 38,
      controlHeightSM: 26,
    },
    Input: {
      borderRadius: 6,
      controlHeight: 32,
      controlHeightLG: 38,
      controlHeightSM: 26,
    },
    Select: {
      borderRadius: 6,
      controlHeight: 32,
      controlHeightLG: 38,
      controlHeightSM: 26,
    },
    Card: {
      borderRadiusLG: 8,
      boxShadowTertiary: '0 1px 0 rgba(27, 31, 35, 0.04)',
    },
    Table: {
      borderRadiusLG: 6,
      headerBg: '#f6f8fa',
      headerColor: '#24292f',
      headerSplitColor: '#d0d7de',
      borderColor: '#d0d7de',
    },
    Modal: {
      borderRadiusLG: 6,
    },
    Tabs: {
      itemActiveColor: '#0969da',
      itemSelectedColor: '#0969da',
    },
  },
};

/**
 * 开发者工具风格的暗色主题配置
 */
export const developerDarkTheme: ThemeConfig = {
  ...developerTheme,
  token: {
    ...developerTheme.token,
    // 主色 - 暗色模式下的蓝色
    colorPrimary: '#58a6ff',
    colorPrimaryHover: '#79c0ff',
    colorPrimaryActive: '#1f6feb',
    colorPrimaryBg: 'rgba(88, 166, 255, 0.15)',
    colorPrimaryBorder: '#58a6ff',

    // 中性色 - 暗色模式
    colorText: '#c9d1d9',
    colorTextSecondary: '#8b949e',
    colorTextTertiary: '#6e7681',
    colorTextDisabled: '#484f58',

    colorBgContainer: '#0d1117',
    colorBgElevated: '#161b22',
    colorBgLayout: '#010409',

    colorBorder: '#30363d',
    colorBorderSecondary: '#21262d',

    // 功能色 - 暗色模式
    colorSuccess: '#3fb950',
    colorSuccessBg: 'rgba(63, 185, 80, 0.15)',
    colorSuccessBorder: '#238636',

    colorWarning: '#d29922',
    colorWarningBg: 'rgba(210, 153, 34, 0.15)',
    colorWarningBorder: '#9a6700',

    colorError: '#f85149',
    colorErrorBg: 'rgba(248, 81, 73, 0.15)',
    colorErrorBorder: '#f85149',
  },
  components: {
    Button: {
      borderRadius: 6,
      controlHeight: 32,
      controlHeightLG: 38,
      controlHeightSM: 26,
    },
    Input: {
      borderRadius: 6,
      controlHeight: 32,
      controlHeightLG: 38,
      controlHeightSM: 26,
    },
    Select: {
      borderRadius: 6,
      controlHeight: 32,
      controlHeightLG: 38,
      controlHeightSM: 26,
    },
    Card: {
      borderRadiusLG: 8,
    },
    Table: {
      borderRadiusLG: 6,
      headerBg: '#161b22',
      headerColor: '#c9d1d9',
      headerSplitColor: '#30363d',
      borderColor: '#30363d',
    },
    Modal: {
      borderRadiusLG: 6,
    },
  },
};

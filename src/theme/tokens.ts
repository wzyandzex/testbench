/**
 * 主题 Token 定义
 * 统一管理深色/浅色模式的颜色变量
 */

export interface ThemeTokens {
  bg: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
    overlay: string;
  };
  border: {
    default: string;
    hover: string;
    focus: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
  };
  brand: {
    primary: string;
    secondary: string;
  };
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

/**
 * 浅色主题 Token
 */
export const lightTokens: ThemeTokens = {
  bg: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
    elevated: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.45)',
  },
  border: {
    default: 'rgba(0, 0, 0, 0.08)',
    hover: 'rgba(0, 0, 0, 0.12)',
    focus: 'rgba(102, 126, 234, 0.3)',
  },
  text: {
    primary: '#111111',
    secondary: '#666666',
    tertiary: '#999999',
    disabled: '#d9d9d9',
  },
  brand: {
    primary: '#667eea',
    secondary: '#764ba2',
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#1677ff',
  },
};

/**
 * 深色主题 Token
 */
export const darkTokens: ThemeTokens = {
  bg: {
    primary: '#0a0a0a',
    secondary: 'rgba(26, 26, 26, 0.8)',
    tertiary: 'rgba(255, 255, 255, 0.05)',
    elevated: 'rgba(26, 26, 26, 0.8)',
    overlay: 'rgba(0, 0, 0, 0.65)',
  },
  border: {
    default: 'rgba(255, 255, 255, 0.08)',
    hover: 'rgba(102, 126, 234, 0.3)',
    focus: 'rgba(102, 126, 234, 0.4)',
  },
  text: {
    primary: 'rgba(255, 255, 255, 0.95)',
    secondary: 'rgba(255, 255, 255, 0.65)',
    tertiary: 'rgba(255, 255, 255, 0.45)',
    disabled: 'rgba(255, 255, 255, 0.25)',
  },
  brand: {
    primary: '#667eea',
    secondary: '#764ba2',
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#1677ff',
  },
};

/**
 * 获取当前主题的 Token
 */
export const getThemeTokens = (theme: 'light' | 'dark'): ThemeTokens => {
  return theme === 'dark' ? darkTokens : lightTokens;
};

/**
 * ECharts 深色主题配置
 */
export const echartsDarkTheme = {
  backgroundColor: 'transparent',
  textStyle: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  title: {
    textStyle: {
      color: 'rgba(255, 255, 255, 0.95)',
    },
  },
  legend: {
    textStyle: {
      color: 'rgba(255, 255, 255, 0.65)',
    },
  },
  tooltip: {
    backgroundColor: 'rgba(26, 26, 26, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    textStyle: {
      color: 'rgba(255, 255, 255, 0.95)',
    },
  },
  categoryAxis: {
    axisLine: {
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.15)',
      },
    },
    axisTick: {
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.15)',
      },
    },
    axisLabel: {
      color: 'rgba(255, 255, 255, 0.65)',
    },
    splitLine: {
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.08)',
      },
    },
  },
  valueAxis: {
    axisLine: {
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.15)',
      },
    },
    axisTick: {
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.15)',
      },
    },
    axisLabel: {
      color: 'rgba(255, 255, 255, 0.65)',
    },
    splitLine: {
      lineStyle: {
        color: 'rgba(255, 255, 255, 0.08)',
        type: 'dashed',
      },
    },
  },
  graph: {
    itemStyle: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    lineStyle: {
      color: 'rgba(255, 255, 255, 0.1)',
    },
  },
};

/**
 * ECharts 浅色主题配置
 */
export const echartsLightTheme = {
  backgroundColor: 'transparent',
  textStyle: {
    color: '#666666',
  },
  title: {
    textStyle: {
      color: '#333333',
    },
  },
  legend: {
    textStyle: {
      color: '#666666',
    },
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#e8e8e8',
    textStyle: {
      color: '#333333',
    },
  },
  categoryAxis: {
    axisLine: {
      lineStyle: {
        color: '#e8e8e8',
      },
    },
    axisTick: {
      lineStyle: {
        color: '#e8e8e8',
      },
    },
    axisLabel: {
      color: '#666666',
    },
    splitLine: {
      lineStyle: {
        color: '#f0f0f0',
      },
    },
  },
  valueAxis: {
    axisLine: {
      show: false,
    },
    axisTick: {
      show: false,
    },
    axisLabel: {
      color: '#666666',
    },
    splitLine: {
      lineStyle: {
        color: '#f0f0f0',
        type: 'dashed',
      },
    },
  },
};

/**
 * 获取 ECharts 主题配置
 */
export const getEchartsTheme = (theme: 'light' | 'dark') => {
  return theme === 'dark' ? echartsDarkTheme : echartsLightTheme;
};

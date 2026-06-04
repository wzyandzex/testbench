/**
 * 主题相关 Hooks
 */

import { useMemo } from 'react';
import { useUiStore } from '@/stores/uiStore';
import { lightTokens, darkTokens, getEchartsTheme, type ThemeTokens } from './tokens';

/**
 * 使用主题 Token
 * 根据当前主题模式返回对应的颜色变量
 */
export const useThemeTokens = (): ThemeTokens => {
  const theme = useUiStore((s) => s.theme);
  return useMemo(() => (theme === 'dark' ? darkTokens : lightTokens), [theme]);
};

/**
 * 使用主题模式
 * 返回当前的主题模式 'light' | 'dark'
 */
export const useTheme = (): 'light' | 'dark' => {
  return useUiStore((s) => s.theme);
};

/**
 * 使用 ECharts 主题配置
 * 根据当前主题返回 ECharts 的配置对象
 */
export const useEchartsTheme = () => {
  const theme = useUiStore((s) => s.theme);
  return useMemo(() => getEchartsTheme(theme), [theme]);
};

/**
 * 判断是否为深色模式
 */
export const useIsDark = (): boolean => {
  const theme = useUiStore((s) => s.theme);
  return theme === 'dark';
};

/**
 * 获取 Monaco 编辑器主题名称
 */
export const useMonacoTheme = (): string => {
  const isDark = useIsDark();
  return isDark ? 'github-dark' : 'github-light';
};

import { ConfigProvider, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { useUiStore } from '@/stores';
import { useEffect } from 'react';

const antdLocales = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

// 导入现代主题 CSS
import '@/assets/styles/themes/modern-dark.css';
import '@/assets/styles/themes/modern-light.css';

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useUiStore((state) => state.theme);
  const language = useUiStore((state) => state.language);

  useEffect(() => {
    // 应用主题到 data 属性
    document.documentElement.setAttribute('data-theme', theme);

    // 应用现代主题到 data 属性（用于现代布局）
    document.documentElement.setAttribute('data-modern-theme', theme);

    // 应用语言到 html 标签
    document.documentElement.lang = language;
  }, [theme, language]);

  const antdThemeConfig = {
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 6,
      fontSize: 14,
    },
    algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
  };

  return (
    <ConfigProvider theme={antdThemeConfig} locale={antdLocales[language]}>
      {children}
    </ConfigProvider>
  );
}

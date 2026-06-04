import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import { useUiStore } from '@/stores';
import { useEffect } from 'react';

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const language = useUiStore((state) => state.language);

  useEffect(() => {
    // 更新 i18n 语言
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

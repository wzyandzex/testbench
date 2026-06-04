import { GlobalOutlined } from '@ant-design/icons';
import { Button, Dropdown, type MenuProps, theme } from 'antd';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/stores';

type LanguageValue = 'zh-CN' | 'en-US';

interface LanguageOption {
  key: LanguageValue;
  labelKey: string;
  shortLabel: string;
}

interface LanguageSwitcherProps {
  variant?: 'classic' | 'modern-dark' | 'modern-light';
}

const languageOptions: LanguageOption[] = [
  { key: 'zh-CN', labelKey: 'ui.zhCN', shortLabel: '中' },
  { key: 'en-US', labelKey: 'ui.enUS', shortLabel: 'EN' },
];

export function LanguageSwitcher({ variant = 'classic' }: LanguageSwitcherProps) {
  const { t } = useTranslation(['common', 'settings']);
  const language = useUiStore((state) => state.language);
  const setLanguage = useUiStore((state) => state.setLanguage);
  const { token } = theme.useToken();

  const menuItems: MenuProps['items'] = useMemo(
    () =>
      languageOptions.map((option) => ({
        key: option.key,
        label: t(`settings:${option.labelKey}`),
        onClick: () => setLanguage(option.key),
      })),
    [setLanguage, t]
  );

  const currentLanguage = languageOptions.find((option) => option.key === language) ?? languageOptions[0];

  if (variant === 'modern-dark') {
    return (
      <Dropdown menu={{ items: menuItems, selectedKeys: [language] }} placement="bottomRight" trigger={['click']}>
        <button
          type="button"
          title={t('common:language')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            width: 52,
            height: 36,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 10,
            color: 'rgba(255,255,255,0.72)',
            cursor: 'pointer',
            fontSize: 13,
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
            event.currentTarget.style.background = 'rgba(102, 126, 234, 0.15)';
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            event.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
        >
          <GlobalOutlined />
          <span>{currentLanguage.shortLabel}</span>
        </button>
      </Dropdown>
    );
  }

  if (variant === 'modern-light') {
    return (
      <Dropdown menu={{ items: menuItems, selectedKeys: [language] }} placement="bottomRight" trigger={['click']}>
        <button
          type="button"
          title={t('common:language')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            width: 52,
            height: 36,
            background: 'transparent',
            border: 0,
            borderRadius: 8,
            color: '#666666',
            cursor: 'pointer',
            fontSize: 13,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.background = '#f3f4f6';
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = 'transparent';
          }}
        >
          <GlobalOutlined />
          <span>{currentLanguage.shortLabel}</span>
        </button>
      </Dropdown>
    );
  }

  return (
    <Dropdown menu={{ items: menuItems, selectedKeys: [language] }} placement="bottomRight" arrow trigger={['click']}>
      <Button
        type="text"
        icon={<GlobalOutlined />}
        title={t('common:language')}
        style={{
          fontSize: 14,
          minWidth: 52,
          width: 52,
          height: 40,
          borderRadius: token.borderRadiusLG,
          color: token.colorTextSecondary,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        {currentLanguage.shortLabel}
      </Button>
    </Dropdown>
  );
}

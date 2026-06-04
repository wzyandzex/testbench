import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfigProvider, Tabs } from 'antd';
import type { UiStyle } from '@/stores';
import { ComponentShowcase } from './ComponentShowcase';
import { DashboardPreview } from './DashboardPreview';

/**
 * Theme preview page
 * Showcases three UI styles to help users pick the right design
 */
export default function PreviewPage() {
  const { t } = useTranslation('preview');
  const [activeStyle, setActiveStyle] = useState<UiStyle>('enterprise');

  const handleStyleChange = useCallback(
    (key: string) => {
      const style = key as UiStyle;
      setActiveStyle(style);
    },
    []
  );

  // Enterprise theme
  const enterpriseThemeConfig = {
    token: {
      colorPrimary: '#1677ff',
      borderRadius: 6,
      fontSize: 14,
    },
  };

  // Modern minimalist theme
  const modernThemeConfig = {
    token: {
      colorPrimary: '#000000',
      borderRadius: 8,
      fontSize: 14,
      colorBgContainer: '#ffffff',
      colorBgLayout: '#fafafa',
    },
    components: {
      Button: {
        colorPrimary: '#000000',
        defaultBg: '#ffffff',
        defaultBorderColor: '#eaeaea',
      },
      Tabs: {
        itemActiveColor: '#000000',
        itemSelectedColor: '#000000',
      },
    },
  };

  // Developer tools theme
  const developerThemeConfig = {
    token: {
      colorPrimary: '#0969da',
      borderRadius: 6,
      fontSize: 14,
      colorBgLayout: '#f6f8fa',
    },
    components: {
      Table: {
        headerBg: '#f6f8fa',
      },
      Tabs: {
        itemActiveColor: '#0969da',
        itemSelectedColor: '#0969da',
      },
    },
  };

  // Resolve theme config by active style
  const getThemeConfig = () => {
    switch (activeStyle) {
      case 'enterprise':
        return enterpriseThemeConfig;
      case 'modern':
        return modernThemeConfig;
      case 'developer':
        return developerThemeConfig;
      default:
        return enterpriseThemeConfig;
    }
  };

  // Resolve style description by active style
  const getStyleDescription = () => {
    switch (activeStyle) {
      case 'enterprise':
        return t('styleDesc.enterprise');
      case 'modern':
        return t('styleDesc.modern');
      case 'developer':
        return t('styleDesc.developer');
      default:
        return '';
    }
  };

  const tabItems = [
    { key: 'enterprise', label: t('tabs.enterprise') },
    { key: 'modern', label: t('tabs.modern') },
    { key: 'developer', label: t('tabs.developer') },
  ];

  return (
    <ConfigProvider theme={getThemeConfig()}>
      <div style={{ minHeight: '100vh', backgroundColor: activeStyle === 'modern' ? '#fafafa' : '#f5f5f5' }}>
        {/* Top navigation bar */}
        <div
          style={{
            backgroundColor: '#fff',
            borderBottom: '1px solid #d9d9d9',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{t('title')}</h1>
            <p style={{ margin: '4px 0 0 0', color: 'rgba(0,0,0,0.45)', fontSize: 14 }}>
              {getStyleDescription()}
            </p>
          </div>
        </div>

        {/* Style switcher */}
        <div
          style={{
            backgroundColor: '#fff',
            padding: '16px 24px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Tabs
            activeKey={activeStyle}
            onChange={handleStyleChange}
            items={tabItems}
            size="large"
            centered
          />
        </div>

        {/* Content */}
        <div style={{ padding: 24 }}>
          {/* Component showcase */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>{t('sections.componentShowcase')}</h2>
            <ComponentShowcase />
          </section>

          {/* Full Dashboard preview */}
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
              {t('sections.dashboardPreview')}
            </h2>
            <DashboardPreview />
          </section>
        </div>
      </div>
    </ConfigProvider>
  );
}

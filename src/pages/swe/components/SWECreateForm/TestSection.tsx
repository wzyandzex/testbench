/**
 * Test Configuration Section
 * Test strategy config — terminal-style radio + slider
 */

import { memo, useMemo } from 'react';
import { Typography, Space, Card, Slider, Switch } from 'antd';
import {
  ExperimentOutlined,
  ThunderboltOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '@/theme';
import { getSWETheme } from '../../theme';
import { useSWEFormContext } from './index';

const { Text } = Typography;

// Strategy configuration — labels resolved at runtime
const STRATEGIES = [
  {
    value: 'full' as const,
    icon: <ExperimentOutlined />,
    color: '#52c41a',
    get label() { return i18next.t('swe:testStrategy.full.label'); },
    get description() { return i18next.t('swe:testStrategy.full.description'); },
  },
  {
    value: 'smart' as const,
    icon: <ThunderboltOutlined />,
    color: '#1890ff',
    get label() { return i18next.t('swe:testStrategy.smart.label'); },
    get description() { return i18next.t('swe:testStrategy.smart.description'); },
  },
  {
    value: 'skip' as const,
    icon: <CloseCircleOutlined />,
    color: '#8c8c8c',
    get label() { return i18next.t('swe:testStrategy.skip.label'); },
    get description() { return i18next.t('swe:testStrategy.skip.description'); },
  },
];

export const TestSection = memo(function TestSection() {
  const { t } = useTranslation('swe');
  const isDark = useIsDark();
  const theme = getSWETheme(isDark);
  const { state, updateField } = useSWEFormContext();

  const handleTestStrategyChange = (value: typeof STRATEGIES[number]['value']) => {
    updateField('testStrategy', value);
  };

  const handleMaxRetriesChange = (value: number) => {
    updateField('maxRetries', value);
  };

  const handleAutoFixChange = (checked: boolean) => {
    updateField('autoFix', checked);
  };

  // Section style
  const sectionStyle = useMemo(() => {
    const baseStyle: React.CSSProperties = {
      borderRadius: isDark ? '16px' : '12px',
      padding: isDark ? '32px' : '24px',
      transition: 'all 0.3s ease',
    };

    if (isDark) {
      return {
        ...baseStyle,
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        boxShadow: theme.cardShadow,
      };
    }

    return {
      ...baseStyle,
      background: '#ffffff',
      border: `1px solid ${theme.borderLight}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    };
  }, [isDark, theme]);

  // Section title style
  const sectionTitleStyle = useMemo(
    () => ({
      fontSize: isDark ? '15px' : '14px',
      fontWeight: 600,
      color: theme.textPrimary,
      marginBottom: isDark ? '18px' : '16px',
      paddingBottom: '12px',
      borderBottom: `1px solid ${isDark ? theme.border : 'rgba(0,0,0,0.06)'}`,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    }),
    [isDark, theme]
  );

  // Strategy card style
  const getStrategyCardStyle = (isSelected: boolean) => {
    const baseStyle: React.CSSProperties = {
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
    };

    if (isDark) {
      if (isSelected) {
        return {
          ...baseStyle,
          background: `${theme.accent}15`,
          border: `1px solid ${theme.accent}`,
          borderRadius: '12px',
          boxShadow: theme.glow,
        };
      }
      return {
        ...baseStyle,
        background: 'transparent',
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: '12px',
      };
    }

    if (isSelected) {
      return {
        ...baseStyle,
        background: `${theme.accent}10`,
        border: `2px solid ${theme.accent}`,
        borderRadius: '8px',
      };
    }
    return {
      ...baseStyle,
      background: '#ffffff',
      border: `1px solid #d9d9d9`,
      borderRadius: '8px',
    };
  };

  return (
    <div style={sectionStyle}>
      <Space direction="vertical" size={isDark ? 28 : 24} style={{ width: '100%' }}>
        {/* Test Strategy Selection */}
        <div>
          <div style={sectionTitleStyle}>
            <span style={{ color: theme.syntaxKeyword }}>test:</span>
            <span>{t('createForm.testSection.title')}</span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: isDark ? '16px' : '12px',
            }}
          >
            {STRATEGIES.map((strategy) => {
              const isSelected = state.testStrategy === strategy.value;
              return (
                <Card
                  key={strategy.value}
                  size="small"
                  bodyStyle={{
                    padding: isDark ? '18px' : '14px',
                  }}
                  style={getStrategyCardStyle(isSelected)}
                  onClick={() => handleTestStrategyChange(strategy.value)}
                  hoverable={!isSelected}
                >
                  <Space direction="vertical" size={8}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '18px',
                          color: isSelected
                            ? strategy.color
                            : isDark
                            ? theme.textSecondary
                            : '#8c8c8c',
                        }}
                      >
                        {strategy.icon}
                      </span>
                      <Text
                        strong={isSelected}
                        style={{
                          color: isSelected ? strategy.color : theme.textPrimary,
                        }}
                      >
                        {strategy.label}
                      </Text>
                    </div>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: '12px',
                        lineHeight: 1.4,
                      }}
                    >
                      {strategy.description}
                    </Text>
                  </Space>

                  {/* Selection indicator */}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: strategy.color,
                        borderRadius: '0 0 12px 12px',
                      }}
                    />
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Max Retries Slider */}
        <div>
          <div style={sectionTitleStyle}>
            <span style={{ color: theme.syntaxString }}>"</span>
            <span>maxRetries</span>
            <span style={{ color: theme.syntaxString }}>"</span>
            <span style={{ color: theme.syntaxComment, marginLeft: '8px' }}>: </span>
            <span style={{ color: theme.syntaxNumber }}>{state.maxRetries}</span>
          </div>
          <div style={{ padding: isDark ? '0 10px' : '0' }}>
            <Slider
              min={0}
              max={10}
              value={state.maxRetries}
              onChange={handleMaxRetriesChange}
              marks={{
                0: '0',
                3: '3',
                5: '5',
                10: '10',
              }}
              styles={{
                track: {
                  background: isDark ? theme.gradientPrimary : '#1890ff',
                },
                handle: {
                  borderColor: isDark ? theme.accent : '#1890ff',
                },
              }}
            />
            <Text
              type="secondary"
              style={{
                fontSize: '12px',
                display: 'block',
                marginTop: '8px',
                textAlign: 'center',
              }}
            >
              {t('createForm.testSection.maxRetriesHint')}
            </Text>
          </div>
        </div>

        {/* Auto Fix Toggle */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: isDark ? '18px 22px' : '14px 18px',
              background: isDark ? `${theme.syntaxKeyword}15` : 'rgba(24, 144, 255, 0.05)',
              border: `1px solid ${isDark ? theme.syntaxKeyword + '30' : 'rgba(24, 144, 255, 0.2)'}`,
              borderRadius: isDark ? '12px' : '8px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: isDark ? '14px' : '14px',
                  fontWeight: 500,
                  color: theme.textPrimary,
                  marginBottom: '4px',
                }}
              >
                <span style={{ color: theme.syntaxFunction }}>enableAutoFix</span>
                <span style={{ color: theme.syntaxComment, marginLeft: '8px' }}> = </span>
                <span style={{ color: state.autoFix ? theme.syntaxNumber : theme.syntaxKeyword }}>
                  {state.autoFix ? 'true' : 'false'}
                </span>
              </div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {t('createForm.testSection.autoFixDesc')}
              </Text>
            </div>
            <Switch
              checked={state.autoFix}
              onChange={handleAutoFixChange}
              checkedChildren="ON"
              unCheckedChildren="OFF"
            />
          </div>
        </div>
      </Space>
    </div>
  );
});

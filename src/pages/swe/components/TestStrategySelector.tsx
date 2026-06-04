/**
 * Test strategy selector
 */

import { Radio, Space, Typography, Card } from 'antd';
import {
  ExperimentOutlined,
  ThunderboltOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import type { TestStrategy } from '@/types';

const { Text, Paragraph } = Typography;

interface TestStrategySelectorProps {
  value?: TestStrategy;
  onChange?: (value: TestStrategy) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}

// Strategy config — label/description via i18next getters
const STRATEGIES = [
  {
    value: 'full' as TestStrategy,
    icon: <ExperimentOutlined />,
    color: '#52c41a',
    get label() { return i18next.t('swe:testStrategy.full.label'); },
    get description() { return i18next.t('swe:testStrategy.full.description'); },
  },
  {
    value: 'smart' as TestStrategy,
    icon: <ThunderboltOutlined />,
    color: '#1890ff',
    get label() { return i18next.t('swe:testStrategy.smart.label'); },
    get description() { return i18next.t('swe:testStrategy.smart.description'); },
  },
  {
    value: 'skip' as TestStrategy,
    icon: <CloseCircleOutlined />,
    color: '#8c8c8c',
    get label() { return i18next.t('swe:testStrategy.skip.label'); },
    get description() { return i18next.t('swe:testStrategy.skip.description'); },
  },
];

export const TestStrategySelector = ({
  value = 'smart',
  onChange,
  disabled,
  style,
}: TestStrategySelectorProps) => {
  const { t } = useTranslation('swe');
  const currentStrategy = STRATEGIES.find((s) => s.value === value) || STRATEGIES[1];

  return (
    <div style={style}>
      <Radio.Group
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {STRATEGIES.map((strategy) => (
            <Card
              key={strategy.value}
              size="small"
              style={{
                cursor: disabled ? 'not-allowed' : 'pointer',
                border:
                  value === strategy.value
                    ? `2px solid ${strategy.color}`
                    : '1px solid #d9d9d9',
                background:
                  value === strategy.value ? `${strategy.color}08` : 'transparent',
                opacity: disabled ? 0.6 : 1,
              }}
            >
              <Radio value={strategy.value}>
                <Space>
                  <span style={{ color: strategy.color }}>{strategy.icon}</span>
                  <Text strong>{strategy.label}</Text>
                </Space>
              </Radio>
              <Paragraph
                style={{
                  margin: '4px 0 0 24px',
                  fontSize: 12,
                  color: '#8c8c8c',
                }}
              >
                {strategy.description}
              </Paragraph>
            </Card>
          ))}
        </Space>
      </Radio.Group>

      {/* Current selection hint */}
      <div style={{ marginTop: 12 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t('testStrategy.recommendation')}: {currentStrategy.label} - {currentStrategy.description}
        </Text>
      </div>
    </div>
  );
};

export default TestStrategySelector;

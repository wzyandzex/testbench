/**
 * SWE test result viewer
 */

import { Card, Descriptions, Progress, Tag, Space, Typography, Collapse } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { SWETestResult } from '@/types';

const { Text, Title } = Typography;
const { Panel } = Collapse;

interface TestResultProps {
  result?: SWETestResult;
  loading?: boolean;
  style?: React.CSSProperties;
}

export const TestResult = ({ result, loading, style }: TestResultProps) => {
  const { t } = useTranslation('swe');

  if (loading) {
    return (
      <Card style={style} loading>
        <Descriptions column={2} />
      </Card>
    );
  }

  if (!result) {
    return (
      <Card style={style}>
        <Text type="secondary">{t('test.noResult')}</Text>
      </Card>
    );
  }

  // Pass-rate color
  const getPassRateColor = (rate: number) => {
    if (rate >= 80) return '#52c41a';
    if (rate >= 50) return '#faad14';
    return '#ff4d4f';
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return t('test.durationSeconds', { count: Math.round(seconds * 10) / 10 });
    return t('test.durationMinutesSeconds', {
      minutes: Math.floor(seconds / 60),
      seconds: (seconds % 60).toFixed(1),
    });
  };

  return (
    <Space direction="vertical" style={{ width: '100%', ...style }} size={12}>
      {/* Overview card */}
      <Card
        title={
          <Space>
            <Title level={5} style={{ margin: 0 }}>
              {t('test.overviewTitle')}
            </Title>
            {result.passRate === 100 && (
              <Tag icon={<CheckCircleOutlined />} color="success">
                {t('test.allPassed')}
              </Tag>
            )}
          </Space>
        }
        styles={{
          body: { paddingTop: 12 },
        }}
      >
        <Descriptions column={2} size="small">
          <Descriptions.Item label={t('test.totalTests')}>
            <Text strong>{result.totalTests}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('test.passed')}>
            <Text style={{ color: '#52c41a' }}>
              <CheckCircleOutlined /> {result.passedTests}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('test.failed')}>
            <Text style={{ color: '#ff4d4f' }}>
              <CloseCircleOutlined /> {result.failedTests}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('test.skipped')}>
            <Text style={{ color: '#8c8c8c' }}>
              <MinusCircleOutlined /> {result.skippedTests}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('test.passRate')}>
            <Space>
              <Text
                strong
                style={{ color: getPassRateColor(result.passRate) }}
              >
                {result.passRate.toFixed(1)}%
              </Text>
              <Progress
                type="circle"
                percent={result.passRate}
                size={40}
                strokeColor={getPassRateColor(result.passRate)}
                format={(percent) => `${percent?.toFixed(0)}%`}
              />
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label={t('test.duration')}>
            <Text>
              <ClockCircleOutlined /> {formatDuration(result.duration)}
            </Text>
          </Descriptions.Item>
        </Descriptions>

        {/* Coverage */}
        {result.coverage && (
          <div style={{ marginTop: 16 }}>
            <Text strong>{t('test.coverageTitle')}</Text>
            <Descriptions column={4} size="small" style={{ marginTop: 8 }}>
              <Descriptions.Item label={t('coverage.line')}>
                <Progress
                  percent={result.coverage.lines}
                  size="small"
                  format={(percent) => `${percent}%`}
                />
              </Descriptions.Item>
              <Descriptions.Item label={t('coverage.function')}>
                <Progress
                  percent={result.coverage.functions}
                  size="small"
                  format={(percent) => `${percent}%`}
                />
              </Descriptions.Item>
              <Descriptions.Item label={t('coverage.branch')}>
                <Progress
                  percent={result.coverage.branches}
                  size="small"
                  format={(percent) => `${percent}%`}
                />
              </Descriptions.Item>
              <Descriptions.Item label={t('coverage.statement')}>
                <Progress
                  percent={result.coverage.statements}
                  size="small"
                  format={(percent) => `${percent}%`}
                />
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Card>

      {/* Failed test cases */}
      {result.failedTestCases && result.failedTestCases.length > 0 && (
        <Card title={t('test.failedCases')} size="small">
          <Collapse ghost>
            {result.failedTestCases.map((testCase, index) => (
              <Panel
                header={
                  <Space>
                    <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                    <Text>{testCase.name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {testCase.file}:{testCase.line}
                    </Text>
                  </Space>
                }
                key={index}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text type="secondary">
                    {t('test.caseFile')}: {testCase.file}
                  </Text>
                  <Text type="secondary">
                    {t('test.caseLine')}: {testCase.line}
                  </Text>
                  {testCase.error && (
                    <div
                      style={{
                        padding: 8,
                        background: '#fff2f0',
                        border: '1px solid #ffccc7',
                        borderRadius: 4,
                      }}
                    >
                      <Text style={{ color: '#ff4d4f' }}>
                        {testCase.error}
                      </Text>
                    </div>
                  )}
                  <Text type="secondary">
                    {t('test.caseDuration')}: {testCase.duration.toFixed(2)}s
                  </Text>
                </Space>
              </Panel>
            ))}
          </Collapse>
        </Card>
      )}
    </Space>
  );
};

export default TestResult;

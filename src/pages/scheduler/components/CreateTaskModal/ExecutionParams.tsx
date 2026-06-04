/**
 * ExecutionParams Component
 * 执行参数面板 - 优先级、超时时间、最大步数配置
 */

import { memo, useState } from 'react';
import { Collapse, Form, InputNumber, Select, Tag } from 'antd';
import { SettingOutlined, DownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '@/theme';
import { getSchedulerTheme } from '../../theme';
import { getExecutionParamsStyle, PRIORITY_OPTIONS } from './style';
import type { FormInstance } from 'antd/es/form';

const { Panel } = Collapse;

interface ExecutionParamsProps {
  form: FormInstance;
}

export const ExecutionParams = memo(function ExecutionParams({
  form,
}: ExecutionParamsProps) {
  const { t } = useTranslation('scheduler');
  const isDark = useIsDark();
  const theme = getSchedulerTheme(isDark);
  const style = getExecutionParamsStyle(isDark);
  const [collapsed, setCollapsed] = useState(true);

  // 监听优先级变化
  const currentPriority = Form.useWatch('priority', form) || 'p2';
  const priorityConfig = PRIORITY_OPTIONS.find(p => p.value === currentPriority) || PRIORITY_OPTIONS[1];

  return (
    <div style={style.container}>
      {/* 头部 */}
      <div style={style.header}>
        <div style={style.headerLeft}>
          <SettingOutlined style={{ fontSize: '16px' }} />
          <span>{t('panels.execution.header')}</span>
        </div>
        <Tag
          color={priorityConfig.value === 'p1' ? 'error' : priorityConfig.value === 'p2' ? 'warning' : 'default'}
          style={{ margin: 0, fontSize: '12px' }}
        >
          {priorityConfig.label}
        </Tag>
      </div>

      {/* 可折叠参数区域 */}
      <Collapse
        activeKey={collapsed ? [] : ['params']}
        onChange={(keys) => setCollapsed(!keys.includes('params'))}
        bordered={false}
        ghost
        expandIcon={({ isActive }) => (
          <DownOutlined
            style={{
              fontSize: '12px',
              color: theme.textSecondary,
              transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
            }}
          />
        )}
        style={{ backgroundColor: 'transparent' }}
      >
        <Panel key="params" header={<span style={{ fontSize: '13px', color: theme.textSecondary }}>{t('panels.execution.expand')}</span>}>
          <div style={style.paramRow}>
            {/* 优先级 */}
            <div style={style.paramItem}>
              <Form.Item
                label={<span style={{ fontSize: '13px', fontWeight: 500 }}>{t('panels.execution.priority')}</span>}
                name="priority"
                initialValue="p2"
                style={{ marginBottom: 0 }}
              >
                <Select
                  size="small"
                  options={PRIORITY_OPTIONS.map(p => ({
                    label: (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: p.color,
                          }}
                        />
                        {p.label}
                      </span>
                    ),
                    value: p.value,
                  }))}
                  style={{ fontSize: '13px' }}
                />
              </Form.Item>
            </div>

            {/* 超时时间 */}
            <div style={style.paramItem}>
              <Form.Item
                label={<span style={{ fontSize: '13px', fontWeight: 500 }}>{t('panels.execution.timeout')}</span>}
                name="timeout"
                initialValue={300}
                style={{ marginBottom: 0 }}
              >
                <InputNumber
                  size="small"
                  min={60}
                  max={3600}
                  step={60}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </div>

            {/* 最大步数 */}
            <div style={style.paramItem}>
              <Form.Item
                label={<span style={{ fontSize: '13px', fontWeight: 500 }}>{t('panels.execution.maxSteps')}</span>}
                name="maxSteps"
                initialValue={10}
                style={{ marginBottom: 0 }}
              >
                <InputNumber
                  size="small"
                  min={1}
                  max={100}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </div>
          </div>

          {/* 参数说明 */}
          <div
            style={{
              marginTop: '12px',
              padding: '10px 12px',
              background: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
              borderRadius: '8px',
              fontSize: '12px',
              color: theme.textSecondary,
            }}
          >
            <div>• <span dangerouslySetInnerHTML={{ __html: t('panels.execution.hintPriority') }} /></div>
            <div>• <span dangerouslySetInnerHTML={{ __html: t('panels.execution.hintTimeout') }} /></div>
            <div>• <span dangerouslySetInnerHTML={{ __html: t('panels.execution.hintMaxSteps') }} /></div>
          </div>
        </Panel>
      </Collapse>

      {/* 深色模式装饰 */}
      {isDark && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, ${theme.accentCyan}, ${theme.accentPurple})`,
            opacity: 0.5,
          }}
        />
      )}
    </div>
  );
});

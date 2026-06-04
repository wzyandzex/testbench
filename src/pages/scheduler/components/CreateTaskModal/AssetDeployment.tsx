/**
 * AssetDeployment Component
 * 资源部署面板 - 评测任务和 Agent 选择
 */

import { memo, useCallback } from 'react';
import { CheckOutlined } from '@ant-design/icons';
import { Form } from 'antd';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '@/theme';
import { getSchedulerTheme } from '../../theme';
import { getAssetDeploymentStyle } from './style';
import { MOCK_BENCHMARKS, MOCK_AGENTS } from './hooks';
import type { FormInstance } from 'antd/es/form';

interface AssetDeploymentProps {
  form: FormInstance;
  onBenchmarkToggle?: (id: string) => void;
  onAgentToggle?: (id: string) => void;
}

interface AssetCardProps {
  item: { id: string; name: string; icon?: string };
  selected: boolean;
  onClick: () => void;
  isDark: boolean;
  theme: ReturnType<typeof getSchedulerTheme>;
  style: ReturnType<typeof getAssetDeploymentStyle>;
}

const AssetCard = memo(function AssetCard({
  item,
  selected,
  onClick,
  isDark,
  theme,
  style,
}: AssetCardProps) {
  return (
    <div
      style={style.card(selected)}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (isDark) {
          e.currentTarget.style.boxShadow = selected
            ? `0 0 20px ${theme.accentCyan}40`
            : `0 0 15px ${theme.cardBorder}40`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {selected && (
        <div style={style.checkbox}>
          <CheckOutlined style={{ color: isDark ? theme.accentCyan : theme.accentCyan, fontSize: '12px' }} />
        </div>
      )}
      <span style={style.cardIcon}>{item.icon || '📦'}</span>
      <div style={style.cardLabel}>{item.name}</div>
    </div>
  );
});

export const AssetDeployment = memo(function AssetDeployment({
  form,
  onBenchmarkToggle,
  onAgentToggle,
}: AssetDeploymentProps) {
  const { t } = useTranslation('scheduler');
  const isDark = useIsDark();
  const theme = getSchedulerTheme(isDark);
  const style = getAssetDeploymentStyle(isDark);

  // 处理评测任务选择
  const handleBenchmarkToggle = useCallback((id: string) => {
    const current = form.getFieldValue('benchmarkIds') || [];
    const newSelection = current.includes(id)
      ? current.filter((bid: string) => bid !== id)
      : [...current, id];

    form.setFieldsValue({ benchmarkIds: newSelection });
    onBenchmarkToggle?.(id);
  }, [form, onBenchmarkToggle]);

  // 处理 Agent 选择
  const handleAgentToggle = useCallback((id: string) => {
    const current = form.getFieldValue('agentIds') || [];
    const newSelection = current.includes(id)
      ? current.filter((aid: string) => aid !== id)
      : [...current, id];

    form.setFieldsValue({ agentIds: newSelection });
    onAgentToggle?.(id);
  }, [form, onAgentToggle]);

  // 从表单获取选中状态
  const currentBenchmarks = Form.useWatch('benchmarkIds', form) || [];
  const currentAgents = Form.useWatch('agentIds', form) || [];

  return (
    <div style={style.container}>
      {/* 头部 */}
      <div style={style.header}>
        <span>🚀</span>
        <span>{t('panels.asset.header')}</span>
      </div>

      {/* 评测任务选择 */}
      <div style={style.section}>
        <div style={style.sectionTitle}>{t('panels.asset.benchmarks')}</div>
        <div style={style.cardGrid}>
          {MOCK_BENCHMARKS.map((bm) => (
            <AssetCard
              key={bm.id}
              item={bm}
              selected={currentBenchmarks.includes(bm.id)}
              onClick={() => handleBenchmarkToggle(bm.id)}
              isDark={isDark}
              theme={theme}
              style={style}
            />
          ))}
        </div>
      </div>

      {/* Agent 选择 */}
      <div style={style.section}>
        <div style={style.sectionTitle}>{t('panels.asset.agents')}</div>
        <div style={style.cardGrid}>
          {MOCK_AGENTS.map((agent) => (
            <AssetCard
              key={agent.id}
              item={agent}
              selected={currentAgents.includes(agent.id)}
              onClick={() => handleAgentToggle(agent.id)}
              isDark={isDark}
              theme={theme}
              style={style}
            />
          ))}
        </div>
      </div>

      {/* 深色模式装饰 */}
      {isDark && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, ${theme.accentPurple}, ${theme.accentMagenta})`,
            opacity: 0.5,
          }}
        />
      )}
    </div>
  );
});

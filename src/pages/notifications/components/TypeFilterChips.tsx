/**
 * TypeFilterChips Component
 * 类型筛选 Chips 组件
 *
 * 特性:
 * - Chips 风格多选
 * - 成功/错误/警告/信息类型
 * - 显示数量徽标
 */

import { memo, useCallback, useMemo } from 'react';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface TypeFilterChipsProps {
  activeTypes: string[];
  onChange: (types: string[]) => void;
  availableTypes?: string[];
  countsByType?: Record<string, number>;
  className?: string;
}

const DEFAULT_TYPE_KEYS = ['success', 'error', 'warning', 'info'];

export const TypeFilterChips = memo(function TypeFilterChips({
  activeTypes,
  onChange,
  availableTypes = DEFAULT_TYPE_KEYS,
  countsByType = {},
  className = '',
}: TypeFilterChipsProps) {
  const { t } = useTranslation('notifications');

  // 默认类型配置
  const DEFAULT_TYPE_CONFIG = useMemo(() => ([
    { key: 'success', label: t('type.success'), icon: <CheckCircleOutlined />, color: '#10b981' },
    { key: 'error', label: t('type.error'), icon: <CloseCircleOutlined />, color: '#ef4444' },
    { key: 'warning', label: t('type.warning'), icon: <WarningOutlined />, color: '#f59e0b' },
    { key: 'info', label: t('type.info'), icon: <InfoCircleOutlined />, color: '#1677ff' },
  ]), [t]);

  // 获取可用的类型配置
  const typeConfigs = useMemo(() => {
    return DEFAULT_TYPE_CONFIG.filter((tc) => availableTypes.includes(tc.key));
  }, [availableTypes, DEFAULT_TYPE_CONFIG]);

  const handleTypeToggle = useCallback(
    (type: string) => {
      if (activeTypes.includes(type)) {
        // 如果只剩一个，不允许取消
        if (activeTypes.length > 1) {
          onChange(activeTypes.filter((t) => t !== type));
        }
      } else {
        onChange([...activeTypes, type]);
      }
    },
    [activeTypes, onChange]
  );

  const handleClearAll = useCallback(() => {
    onChange(availableTypes);
  }, [availableTypes, onChange]);

  const isAllSelected = activeTypes.length === availableTypes.length;

  return (
    <div
      className={`type-filter-chips ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      <span
        style={{
          fontSize: 13,
          color: 'var(--notification-filter-label, rgba(255, 255, 255, 0.45))',
          marginRight: 4,
        }}
      >
        {t('filter.typeFilterLabel')}
      </span>

      {/* 全部按钮 */}
      <button
        type="button"
        onClick={isAllSelected ? handleClearAll : () => onChange(availableTypes)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          fontSize: 13,
          fontWeight: isAllSelected ? 600 : 500,
          borderRadius: 20,
          borderWidth: '1px',
          borderStyle: 'solid',
          background: isAllSelected
            ? 'var(--notification-chip-active-bg, rgba(102, 126, 234, 0.15))'
            : 'transparent',
          borderColor: isAllSelected
            ? 'var(--notification-chip-active-border, rgba(102, 126, 234, 0.3))'
            : 'var(--notification-chip-border, rgba(255, 255, 255, 0.1))',
          color: isAllSelected
            ? 'var(--notification-chip-active-text, rgba(255, 255, 255, 0.95))'
            : 'var(--notification-chip-text, rgba(255, 255, 255, 0.55))',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        {isAllSelected ? t('actions.clearSelection') : t('actions.selectAll')}
      </button>

      {/* 类型 Chips */}
      {typeConfigs.map((config) => {
        const isActive = activeTypes.includes(config.key);
        const count = countsByType[config.key] || 0;

        return (
          <button
            key={config.key}
            type="button"
            onClick={() => handleTypeToggle(config.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              borderRadius: 20,
              borderWidth: '1px',
              borderStyle: 'solid',
              background: isActive
                ? `${config.color}15`
                : 'transparent',
              borderColor: isActive
                ? `${config.color}40`
                : 'var(--notification-chip-border, rgba(255, 255, 255, 0.1))',
              color: isActive
                ? config.color
                : 'var(--notification-chip-text, rgba(255, 255, 255, 0.55))',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = `${config.color}30`;
                e.currentTarget.style.background = `${config.color}08`;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = 'var(--notification-chip-border, rgba(255, 255, 255, 0.1))';
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: 14 }}>{config.icon}</span>
            {config.label}
            {count > 0 && (
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 6px',
                  borderRadius: 8,
                  background: isActive
                    ? `${config.color}25`
                    : 'var(--notification-chip-count-bg, rgba(255, 255, 255, 0.1))',
                  color: isActive
                    ? config.color
                    : 'var(--notification-chip-count-text, rgba(255, 255, 255, 0.55))',
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});

export default TypeFilterChips;

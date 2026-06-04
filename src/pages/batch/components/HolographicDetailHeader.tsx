/**
 * 全息详情页头部组件
 * 显示批量任务的基本信息和操作按钮
 * 支持深色模式赛博科技风格
 */

import { useMemo, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Space, Tooltip } from 'antd';
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useIsDark } from '@/theme';
import type { CSSProperties } from 'react';
import { getBatchTheme, BATCH_STATUS_CONFIG } from '../theme';
import { ProgressRing } from './ProgressRing';
import type { BatchStatus } from '../theme';

interface HolographicDetailHeaderProps {
  name: string;
  description?: string;
  status: BatchStatus;
  progress: number;
  total: number;
  failed: number;
  onAction?: (action: 'start' | 'pause' | 'resume' | 'cancel' | 'retry') => void;
  onExport?: () => void;
  loading?: boolean;
}

/**
 * 全息详情页头部
 * ✅ rerender-memo: 使用 memo 优化性能
 */
export const HolographicDetailHeader = memo(function HolographicDetailHeader({
  name,
  description,
  status,
  progress,
  total,
  failed,
  onAction,
  onExport,
  loading = false,
}: HolographicDetailHeaderProps) {
  const isDark = useIsDark();
  const { t } = useTranslation('batch');
  const navigate = useNavigate();
  const theme = getBatchTheme(isDark);

  const statusConfig = BATCH_STATUS_CONFIG[status];
  const statusColor = theme[statusConfig.colorKey];

  // 容器样式
  const containerStyle = useMemo((): CSSProperties => {
    const color = status === 'failed' ? theme.statusFailed :
                  status === 'completed' ? theme.statusCompleted :
                  status === 'running' ? theme.statusRunning :
                  theme.statusPending;

    return {
      position: 'relative',
      padding: '24px 32px',
      background: isDark
        ? `linear-gradient(135deg, ${color}15, transparent)`
        : '#fff',
      border: `1px solid ${isDark ? `${color}40` : theme.cardBorder}`,
      borderRadius: isDark ? 0 : 12,
      marginBottom: 24,
      ...(isDark && {
        clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)',
        backdropFilter: 'blur(10px)',
      }),
    };
  }, [isDark, theme, status]);

  // 顶部高光线
  const topHighlightStyle = useMemo((): CSSProperties => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    background: `linear-gradient(90deg, transparent, ${statusColor}, transparent)`,
    opacity: isDark ? 0.8 : 0.3,
  }), [isDark, statusColor]);

  // 头部容器
  const headerStyle = useMemo((): CSSProperties => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  }), []);

  // 标题区域样式
  const titleAreaStyle = useMemo((): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  }), []);

  const titleStyle = useMemo((): CSSProperties => ({
    fontSize: 24,
    fontWeight: 700,
    color: theme.textPrimary,
    margin: 0,
  }), [theme.textPrimary]);

  const descriptionStyle = useMemo((): CSSProperties => ({
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 8,
    marginLeft: 56,
  }), [theme.textSecondary]);

  // 状态徽章样式
  const statusBadgeStyle = useMemo((): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    borderRadius: isDark ? 0 : 20,
    fontSize: 14,
    fontWeight: 600,
    color: statusColor,
    background: theme[statusConfig.bgKey],
    border: isDark ? `1px solid ${statusColor}40` : 'none',
    ...(isDark && status === 'running' && {
      animation: 'batchStatusPulse 2s ease-in-out infinite',
    }),
  }), [isDark, status, statusColor, statusConfig, theme]);

  // 进度区域样式
  const progressAreaStyle = useMemo((): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    padding: '16px 20px',
    background: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
    borderRadius: isDark ? 0 : 8,
  }), [isDark]);

  const infoTextStyle = useMemo((): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  }), []);

  const labelStyle = useMemo((): CSSProperties => ({
    fontSize: 12,
    color: theme.textTertiary,
  }), [theme.textTertiary]);

  const valueStyle = useMemo((): CSSProperties => ({
    fontSize: 18,
    fontWeight: 600,
    color: theme.textPrimary,
  }), [theme.textPrimary]);

  const failedStyle = useMemo((): CSSProperties => ({
    ...valueStyle,
    color: theme.neonRed,
  }), [theme.neonRed]);

  // 导航回调
  const handleBack = useCallback(() => {
    navigate('/batch');
  }, [navigate]);

  // 操作按钮配置
  const actionButtons = useMemo(() => {
    const buttons: React.ReactNode[] = [];

    // 返回按钮
    buttons.push(
      <Tooltip key="back" title={t('detail.backToList')}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          style={{
            borderRadius: isDark ? 0 : 8,
            border: isDark ? `1px solid ${theme.cardBorder}` : undefined,
          }}
        >
          {t('common:actions.back')}
        </Button>
      </Tooltip>
    );

    // 刷新按钮
    buttons.push(
      <Tooltip key="refresh" title={t('detail.refresh')}>
        <Button
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={() => onAction?.('retry')}
          style={{
            borderRadius: isDark ? 0 : 8,
            border: isDark ? `1px solid ${theme.cardBorder}` : undefined,
          }}
        >
          {t('detail.refresh')}
        </Button>
      </Tooltip>
    );

    // 状态相关操作
    if (status === 'pending' || status === 'paused' || status === 'failed') {
      buttons.push(
        <Button
          key="start"
          type="primary"
          icon={<PlayCircleOutlined />}
          loading={loading}
          onClick={() => onAction?.(status === 'paused' ? 'resume' : 'start')}
          style={{
            borderRadius: isDark ? 0 : 8,
            background: isDark ? theme.neonCyan : undefined,
            borderColor: isDark ? theme.neonCyan : undefined,
          }}
        >
          {status === 'paused' ? t('detail.continue') : t('detail.start')}
        </Button>
      );
    }

    if (status === 'running') {
      buttons.push(
        <Button
          key="pause"
          icon={<PauseCircleOutlined />}
          loading={loading}
          onClick={() => onAction?.('pause')}
          style={{
            borderRadius: isDark ? 0 : 8,
            border: isDark ? `1px solid ${theme.cardBorder}` : undefined,
          }}
        >
          {t('common:actions.pause')}
        </Button>
      );
      buttons.push(
        <Button
          key="cancel"
          danger
          icon={<StopOutlined />}
          loading={loading}
          onClick={() => onAction?.('cancel')}
          style={{
            borderRadius: isDark ? 0 : 8,
          }}
        >
          {t('detail.cancel')}
        </Button>
      );
    }

    if (status === 'failed') {
      buttons.push(
        <Button
          key="retry"
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={() => onAction?.('retry')}
          style={{
            borderRadius: isDark ? 0 : 8,
            border: isDark ? `1px solid ${theme.cardBorder}` : undefined,
          }}
        >
          {t('common:actions.retry')}
        </Button>
      );
    }

    // 导出按钮
    if (status === 'completed' || status === 'failed') {
      buttons.push(
        <Button
          key="export"
          icon={<DownloadOutlined />}
          onClick={onExport}
          disabled={status !== 'completed'}
          style={{
            borderRadius: isDark ? 0 : 8,
            border: isDark ? `1px solid ${theme.cardBorder}` : undefined,
          }}
        >
          {t('common:actions.export')}
        </Button>
      );
    }

    return buttons;
  }, [status, loading, theme, isDark, handleBack, onAction, onExport, t]);

  // 计算进度百分比
  const progressPercent = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div style={containerStyle}>
      {/* 顶部高光线 */}
      <div style={topHighlightStyle} />

      {/* 头部：标题 + 操作按钮 */}
      <div style={headerStyle}>
        <div style={{ flex: 1 }}>
          <div style={titleAreaStyle}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              style={{
                borderRadius: isDark ? 0 : 8,
                border: isDark ? `1px solid ${theme.cardBorder}` : undefined,
              }}
            >
              {t('detail.backToList')}
            </Button>
            <div>
              <h1 style={titleStyle}>{name}</h1>
              {description && <div style={descriptionStyle}>{description}</div>}
            </div>
            <div style={statusBadgeStyle}>
              <span style={{ fontSize: 16 }}>{statusConfig.icon}</span>
              <span>{statusConfig.label}</span>
            </div>
          </div>
        </div>

        <Space>{actionButtons.slice(2)}</Space>
      </div>

      {/* 进度区域 */}
      <div style={progressAreaStyle}>
        <ProgressRing
          progress={progressPercent}
          size={72}
          strokeWidth={6}
          color={statusColor}
          pulse={status === 'running'}
        />
        <div style={infoTextStyle}>
          <div style={labelStyle}>{t('detail.completed')} / {t('stats.total')}</div>
          <div style={valueStyle}>{progress} / {total}</div>
        </div>
        {failed > 0 && (
          <div style={infoTextStyle}>
            <div style={labelStyle}>{t('statusLabel.failed')}</div>
            <div style={failedStyle}>{failed}</div>
          </div>
        )}
        <div style={infoTextStyle}>
          <div style={labelStyle}>{t('table.progress')}</div>
          <div style={{ ...valueStyle, color: statusColor }}>{progressPercent}%</div>
        </div>
      </div>

      {/* 注入动画 */}
      {isDark && (
        <style>{`
          @keyframes batchStatusPulse {
            0%, 100% {
              box-shadow: 0 0 5px currentColor, 0 0 10px currentColor;
            }
            50% {
              box-shadow: 0 0 15px currentColor, 0 0 25px currentColor;
            }
          }
        `}</style>
      )}
    </div>
  );
}, (prev, next) => {
  // 细粒度比较
  return (
    prev.name === next.name &&
    prev.status === next.status &&
    prev.progress === next.progress &&
    prev.total === next.total &&
    prev.failed === next.failed &&
    prev.loading === next.loading
  );
});

export default HolographicDetailHeader;

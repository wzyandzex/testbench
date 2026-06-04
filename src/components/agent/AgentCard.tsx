/**
 * Agent 卡片组件 - 全新设计
 *
 * 浅色模式 - 艺术画廊风格：
 * - 左侧彩色状态条
 * - 大尺寸圆形状态徽章
 * - 柔和阴影和圆角
 *
 * 深色模式 - 赛博指挥台风格：
 * - 霓虹边框和发光效果
 * - 状态脉冲动画
 * - 网格纹理背景
 */

import { Card, Tag, Typography, Avatar, Progress } from 'antd';
import {
  CheckCircleOutlined,
  ApiOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useIsDark } from '@/theme';
import { AGENT_THEME, AGENT_TYPE_CONFIG, ANIMATIONS, type AgentType } from '@/pages/agents/theme';
import { TiltCard } from './TiltCard';

const { Text } = Typography;

export interface AgentCardProps {
  id: string;
  name: string;
  description?: string;
  type: AgentType;
  model: string;
  status: 'active' | 'inactive' | 'error';
  totalExecutions: number;
  avgScore: number;
  lastExecution?: Date;
  delay?: number;
  index?: number;
}

// Status badge sub-component
const StatusBadge = ({
  status,
  isDark,
  theme,
  text,
}: {
  status: 'active' | 'inactive' | 'error';
  isDark: boolean;
  theme: typeof AGENT_THEME.light;
  text: string;
}) => {
  const config = {
    active: {
      icon: <CheckCircleOutlined />,
      color: theme.statusActive,
      bg: theme.statusActiveBg,
    },
    inactive: {
      icon: <ApiOutlined />,
      color: theme.statusInactive,
      bg: theme.statusInactiveBg,
    },
    error: {
      icon: <CloseCircleOutlined />,
      color: theme.statusError,
      bg: theme.statusErrorBg,
    },
  }[status];

  const shouldPulse = isDark && status === 'active';

  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: config.bg,
        border: isDark ? `2px solid ${config.color}` : 'none',
        boxShadow: isDark && status === 'active' ? `0 0 15px ${config.color}40` : 'none',
        animation: shouldPulse ? 'statusPulse 2s ease-in-out infinite' : 'none',
        position: 'relative',
      }}
      aria-label={text}
    >
      <span style={{ color: config.color, fontSize: 20 }}>
        {config.icon}
      </span>
    </div>
  );
};

export function AgentCard({
  id,
  name,
  description,
  type,
  model,
  status,
  totalExecutions,
  avgScore,
  lastExecution,
  delay = 0,
}: AgentCardProps) {
  const { t } = useTranslation('agents');
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const isDark = useIsDark();
  const theme = AGENT_THEME[isDark ? 'dark' : 'light'];
  const typeConfig = AGENT_TYPE_CONFIG[type];

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const handleClick = () => {
    navigate(`/agents/${id}`);
  };

  const cardStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(20px)',
    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    height: '100%',
    position: 'relative',
    borderRadius: isDark ? 16 : 12,
    border: isDark
      ? `1px solid ${theme.cardBorder}`
      : `1px solid ${theme.borderLight}`,
    boxShadow: theme.cardShadow,
    background: theme.cardBg,
    overflow: 'hidden',
  };

  // 深色模式网格纹理背景
  const cardBgStyle = isDark
    ? {
        backgroundImage: theme.gridPattern,
        backgroundSize: '20px 20px',
      }
    : {};

  // 浅色模式左侧状态条
  const statusBarStyle = isDark
    ? {}
    : {
        position: 'absolute' as const,
        left: 0,
        top: 16,
        bottom: 16,
        width: 4,
        borderRadius: '0 4px 4px 0',
        background:
          status === 'active'
            ? theme.statusActive
            : status === 'error'
            ? theme.statusError
            : theme.statusInactive,
      };

  const bodyPadding = isDark ? '20px' : '20px 20px 20px 28px'; // 左侧留出状态条空间

  return (
    <>
      <style>{ANIMATIONS.statusPulse}</style>
      <div style={cardStyle}>
        <div style={{ ...cardBgStyle, height: '100%' }}>
          {/* 浅色模式左侧状态条 */}
          {!isDark && <div style={statusBarStyle} />}

          {/* 深色模式霓虹边框效果 - 顶部高亮线 */}
          {isDark && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                background: `linear-gradient(90deg, transparent, ${theme.neonBorder}, transparent)`,
                opacity: status === 'active' ? 1 : 0.5,
              }}
            />
          )}

          <TiltCard onClick={handleClick} intensity={isDark ? 12 : 8}>
            <Card
              hoverable={false}
              style={{
                height: '100%',
                border: 'none',
                boxShadow: 'none',
                background: 'transparent',
              }}
              styles={{ body: { padding: bodyPadding, height: '100%' } }}
            >
              {/* 头部 - 状态徽章 + 标题 */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 8,
                      }}
                    >
                      <Avatar
                        size={isDark ? 36 : 32}
                        style={{
                          background: isDark
                            ? `${typeConfig.darkColor}20`
                            : `${typeConfig.color}15`,
                          color: isDark ? typeConfig.darkColor : typeConfig.color,
                          fontSize: isDark ? 18 : 16,
                          border: isDark
                            ? `1px solid ${typeConfig.darkColor}40`
                            : 'none',
                        }}
                      >
                        {typeConfig.icon}
                      </Avatar>
                      <div
                        style={{
                          fontSize: isDark ? 17 : 16,
                          fontWeight: 600,
                          color: theme.textPrimary,
                        }}
                      >
                        {name}
                      </div>
                    </div>
                    <Text
                      style={{
                        fontSize: 13,
                        color: theme.textSecondary,
                      }}
                      ellipsis={{ tooltip: description }}
                    >
                      {description || model}
                    </Text>
                  </div>

                  <StatusBadge
                    status={status}
                    isDark={isDark}
                    theme={theme}
                    text={status === 'active' ? t('components.card.enabled') : status === 'inactive' ? t('components.card.disabled') : t('components.card.error')}
                  />
                </div>
              </div>

              {/* 类型标签 */}
              <div style={{ marginBottom: 16 }}>
                <Tag
                  style={{
                    margin: 0,
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: isDark
                      ? `1px solid ${typeConfig.darkColor}40`
                      : `1px solid ${typeConfig.color}30`,
                    background: isDark
                      ? `${typeConfig.darkColor}15`
                      : `${typeConfig.color}10`,
                    color: isDark ? typeConfig.darkColor : typeConfig.color,
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {typeConfig.text}
                </Tag>
                <Text
                  style={{
                    fontSize: 12,
                    marginLeft: 10,
                    color: theme.textTertiary,
                  }}
                >
                  {model}
                </Text>
              </div>

              {/* 统计数据 */}
              <div style={{ display: 'flex', gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.textTertiary,
                    }}
                  >
                    {t('components.card.execCount')}
                  </Text>
                  <div
                    style={{
                      fontSize: isDark ? 22 : 20,
                      fontWeight: 600,
                      color: theme.textPrimary,
                      marginTop: 2,
                    }}
                  >
                    {totalExecutions}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.textTertiary,
                    }}
                  >
                    {t('components.card.avgScore')}
                  </Text>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 2,
                    }}
                  >
                    <div
                      style={{
                        fontSize: isDark ? 22 : 20,
                        fontWeight: 600,
                        color:
                          avgScore >= 80
                            ? theme.statusActive
                            : avgScore >= 60
                            ? '#f59e0b'
                            : theme.statusError,
                      }}
                    >
                      {avgScore}%
                    </div>
                    <Progress
                      percent={avgScore}
                      size="small"
                      strokeColor={
                        avgScore >= 80
                          ? isDark
                            ? '#00ffaa'
                            : '#10b981'
                          : avgScore >= 60
                          ? '#f59e0b'
                          : isDark
                          ? '#ff4466'
                          : '#ef4444'
                      }
                      showInfo={false}
                      style={{ flex: 1, maxWidth: 60 }}
                      trailColor={isDark ? 'rgba(255,255,255,0.1)' : undefined}
                    />
                  </div>
                </div>
              </div>

              {/* 底部 - 上次执行 */}
              {lastExecution && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: `1px solid ${theme.borderLight}`,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.textTertiary,
                    }}
                  >
                    {t('components.card.lastExec', { time: dayjs(lastExecution).fromNow() })}
                  </Text>
                </div>
              )}
            </Card>
          </TiltCard>
        </div>
      </div>
    </>
  );
}

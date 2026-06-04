import { Card, Tag, Space, Typography, Progress, Avatar } from 'antd';
import {
  ExperimentOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import {
  useThemeTokens,
  useCardStyle,
  useTextStyle,
  useProgressTrailColor,
  useAvatarBgColor,
} from '@/theme';
import { useCardEnterAnimation } from '@/theme/animations';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

export interface BenchmarkCardProps {
  id: string;
  name: string;
  description?: string;
  language: string;
  category: string;
  status: 'active' | 'draft' | 'archived';
  totalExecutions: number;
  successRate: number;
  lastExecution?: Date | null;
  delay?: number;
}

const languageColors: Record<string, string> = {
  python: '#3776ab',
  javascript: '#f7df1e',
  typescript: '#3178c6',
  java: '#b07219',
  go: '#00add8',
  rust: '#dea584',
  cpp: '#f34b7d',
  default: '#8c8c8c',
};

const categoryTags: Record<string, { color: string; icon: React.ReactNode; textKey: string }> = {
  coding: { color: '#1677ff', icon: <CodeOutlined />, textKey: 'components.card.categoryCoding' },
  reasoning: { color: '#10b981', icon: <FireOutlined />, textKey: 'components.card.categoryReasoning' },
  knowledge: { color: '#f59e0b', icon: <ExperimentOutlined />, textKey: 'components.card.categoryKnowledge' },
  default: { color: '#8c8c8c', icon: <ExperimentOutlined />, textKey: 'components.card.categoryDefault' },
};

function normalizePercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
}

function formatPercent(value: number) {
  return normalizePercent(value).toFixed(1);
}

export function BenchmarkCard({
  id,
  name,
  description,
  language,
  category,
  status,
  totalExecutions,
  successRate,
  lastExecution,
  delay = 0,
}: BenchmarkCardProps) {
  const { t } = useTranslation('benchmarks');
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // 主题 hooks
  const tokens = useThemeTokens();
  const cardStyle = useCardStyle();
  const primaryText = useTextStyle('primary');
  const secondaryText = useTextStyle('secondary');
  const progressTrailColor = useProgressTrailColor();

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const categoryConfigEntry = categoryTags[category] || categoryTags.default;
  const categoryConfig = useMemo(
    () => ({
      ...categoryConfigEntry,
      text:
        categoryTags[category]
          ? t(categoryConfigEntry.textKey)
          : category || t(categoryTags.default.textKey),
    }),
    [category, categoryConfigEntry, t],
  );
  const statusConfig = {
    active: { color: '#10b981', text: t('components.card.statusActive'), icon: <CheckCircleOutlined /> },
    draft: { color: '#9ca3af', text: t('components.card.statusDraft'), icon: <ClockCircleOutlined /> },
    archived: { color: '#d1d5db', text: t('components.card.statusArchived'), icon: <ExperimentOutlined /> },
  }[status];
  const normalizedSuccessRate = normalizePercent(successRate);
  const successRateColor =
    normalizedSuccessRate >= 80
      ? tokens.status.success
      : normalizedSuccessRate >= 60
        ? tokens.status.warning
        : tokens.status.error;

  const handleClick = () => {
    navigate(`/benchmarks/${id}`);
  };

  // 卡片进入动画样式
  const enterStyle = useCardEnterAnimation(delay);

  // 卡片样式（合并基础样式和动态样式）
  const mergedCardStyle = {
    ...cardStyle,
    height: '100%',
    cursor: 'pointer',
    ...(isHovered
      ? {
          borderColor: tokens.border.hover,
          boxShadow: `0 8px 32px ${tokens.brand.primary}20`,
          transform: 'translateY(-4px)',
        }
      : {
          borderColor: (cardStyle as any).border,
          transform: 'translateY(0)',
        }),
    ...(visible ? {} : enterStyle),
  } as React.CSSProperties;

  // 头像背景色
  const avatarBg = useAvatarBgColor(languageColors[language] || languageColors.default);

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <Card
        hoverable={false}
        style={mergedCardStyle}
        styles={{ body: { padding: '20px' } }}
      >
        {/* 头部 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Avatar
                  size={24}
                  style={{
                    background: avatarBg,
                    color: languageColors[language] || languageColors.default,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {language.slice(0, 2).toUpperCase()}
                </Avatar>
                <Tag
                  style={{
                    margin: 0,
                    padding: '2px 8px',
                    borderRadius: 4,
                    border: `1px solid ${categoryConfig.color}30`,
                    background: `${categoryConfig.color}15`,
                    color: categoryConfig.color,
                    fontSize: 12,
                  }}
                >
                  {categoryConfig.text}
                </Tag>
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  ...primaryText,
                  marginBottom: description ? 4 : 0,
                }}
              >
                {name}
              </div>
              {description && (
                <Text style={{ fontSize: 13, ...secondaryText }} ellipsis={{ tooltip: description }}>
                  {description}
                </Text>
              )}
            </div>
          </div>
        </div>

        {/* 状态标签 */}
        <div style={{ marginBottom: 16 }}>
          <Space size={8}>
            <Tag
              icon={statusConfig.icon}
              style={{
                margin: 0,
                padding: '2px 8px',
                borderRadius: 4,
                border: `1px solid ${statusConfig.color}30`,
                background: `${statusConfig.color}15`,
                color: statusConfig.color,
                fontSize: 12,
              }}
            >
              {statusConfig.text}
            </Tag>
            {lastExecution && (
              <Text style={{ fontSize: 12, ...secondaryText }}>
                {dayjs(lastExecution).fromNow()}
              </Text>
            )}
          </Space>
        </div>

        {/* 统计数据 */}
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, ...secondaryText }}>
              {t('components.card.executions')}
            </Text>
            <div style={{ fontSize: 20, fontWeight: 600, ...primaryText, marginTop: 2 }}>
              {totalExecutions}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, ...secondaryText }}>
              {t('components.card.successRate')}
            </Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <div style={{ fontSize: 20, fontWeight: 600, ...primaryText }}>
                {formatPercent(successRate)}%
              </div>
              <Progress
                percent={normalizedSuccessRate}
                size="small"
                strokeColor={successRateColor}
                trailColor={progressTrailColor}
                showInfo={false}
                style={{ flex: 1, maxWidth: 60 }}
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

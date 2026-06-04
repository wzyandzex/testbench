/**
 * SWE task detail page - "Code Terminal Command Center" style
 * Dark mode: cyber-tech aesthetic, terminal-tab windows, holographic progress
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Tag,
  Button,
  Space,
  Tabs,
  Breadcrumb,
  Descriptions,
  Alert,
  Modal,
  message,
  Spin,
} from 'antd';
import {
  HomeOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  LoadingOutlined,
  BugOutlined,
  StopOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  CodeOutlined,
  GitlabOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useSWEStore, useCurrentSWETask, useSWELoading } from '@/stores';
import { useSWEWebSocket } from '@/hooks';
import { SWETaskPhases, TestResult } from './components';
import { TerminalLogViewer } from './components/TerminalLogViewer';
import { HolographicProgress } from './components/HolographicProgress';
import { GitBranchVisualizer } from './components/GitBranchVisualizer';
import { useIsDark } from '@/theme';
import { getSWETheme, getGlobalStyles, STATUS_CONFIG } from './theme';
import { useIssueCodePanelStyle } from './style';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const PAGE_STYLE: React.CSSProperties = {
  padding: '32px 48px',
  maxWidth: 1400,
  margin: '0 auto',
};

// Format duration
const formatDuration = (seconds?: number, t?: any) => {
  if (!seconds) return '-';
  if (seconds < 60) return t ? t('detail.duration.seconds', { count: seconds }) : `${seconds}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return t ? t('detail.duration.minutesSeconds', { minutes: m, seconds: s }) : `${m}m ${s}s`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return t ? t('detail.duration.hoursMinutes', { hours: h, minutes: m }) : `${h}h ${m}m`;
};

export default function SWETaskDetailPage() {
  const { t } = useTranslation('swe');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Store
  const currentTask = useCurrentSWETask();
  const loading = useSWELoading();
  const fetchTask = useSWEStore((state) => state.fetchTask);
  const retryTask = useSWEStore((state) => state.retryTask);
  const fixTask = useSWEStore((state) => state.fixTask);
  const cancelTask = useSWEStore((state) => state.cancelTask);
  const exportTask = useSWEStore((state) => state.exportTask);
  const fetchLogs = useSWEStore((state) => state.fetchLogs);
  const taskLogs = useSWEStore((state) => state.taskLogs);

  // Theme
  const isDark = useIsDark();
  const theme = getSWETheme(isDark);

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // WebSocket connection
  const { connected } = useSWEWebSocket({
    taskId: id,
    enabled: currentTask?.status === 'running',
  });

  // Load task detail
  useEffect(() => {
    if (id) {
      fetchTask(id);
      fetchLogs(id);
    }
    return () => {
      // Cleanup
    };
  }, [id, fetchTask, fetchLogs]);

  // Handle back
  const handleBack = useCallback(() => {
    navigate('/swe');
  }, [navigate]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      await fetchTask(id);
      await fetchLogs(id);
      message.success(t('detail.messages.refreshed'));
    } finally {
      setRefreshing(false);
    }
  }, [id, fetchTask, fetchLogs, t]);

  // Handle retry
  const handleRetry = useCallback(async () => {
    if (!id) return;
    Modal.confirm({
      title: t('actions.retryTitle'),
      content: t('actions.retryContent'),
      okText: t('actions.confirm'),
      cancelText: t('actions.cancel'),
      onOk: async () => {
        try {
          await retryTask(id);
          message.success(t('actions.retrySuccess'));
          await fetchTask(id);
        } catch (error) {
          message.error(t('actions.retryFailed'));
        }
      },
    });
  }, [id, retryTask, fetchTask, t]);

  // Handle auto-fix
  const handleFix = useCallback(async () => {
    if (!id) return;
    Modal.confirm({
      title: t('actions.repairTitle'),
      content: t('actions.repairContent'),
      okText: t('actions.confirm'),
      cancelText: t('actions.cancel'),
      onOk: async () => {
        try {
          await fixTask(id);
          message.success(t('actions.repairSuccess'));
          await fetchTask(id);
        } catch (error) {
          message.error(t('actions.repairFailed'));
        }
      },
    });
  }, [id, fixTask, fetchTask, t]);

  // Handle cancel
  const handleCancel = useCallback(async () => {
    if (!id) return;
    Modal.confirm({
      title: t('actions.cancelTitle'),
      content: t('actions.cancelContent'),
      okText: t('actions.confirm'),
      okType: 'danger',
      cancelText: t('actions.cancelKeep'),
      onOk: async () => {
        try {
          await cancelTask(id);
          message.success(t('actions.cancelSuccess'));
          await fetchTask(id);
        } catch (error) {
          message.error(t('actions.cancelFailed'));
        }
      },
    });
  }, [id, cancelTask, fetchTask, t]);

  // Handle export
  const handleExport = useCallback(async () => {
    if (!id) return;
    try {
      const url = await exportTask(id);
      window.open(url, '_blank');
      message.success(t('actions.exportSuccess'));
    } catch (error) {
      message.error(t('actions.exportFailed'));
    }
  }, [id, exportTask, t]);

  // Derived state
  const statusConfig = useMemo(() => {
    if (!currentTask) return STATUS_CONFIG.pending;
    return STATUS_CONFIG[currentTask.status] || STATUS_CONFIG.pending;
  }, [currentTask]);

  // Issue code panel style
  const issuePanelStyle = useIssueCodePanelStyle();

  // Tab items
  const tabItems = useMemo(() => {
    if (!currentTask) return [];

    return [
      {
        key: 'overview',
        label: (
          <span style={{ fontFamily: '"Fira Code", monospace' }}>
            <FileTextOutlined /> {t('detail.tabs.overview')}
          </span>
        ),
        children: (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            {/* Holographic progress */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '24px 0',
              background: isDark ? 'rgba(22, 27, 34, 0.5)' : 'transparent',
              borderRadius: 8,
            }}>
              <HolographicProgress
                currentPhase={currentTask.currentPhase}
                progress={currentTask.progress}
                size={200}
                strokeWidth={14}
                showLabels={true}
              />
            </div>

            {/* Basic info */}
            <Card
              title={
                <span style={{ fontFamily: '"Fira Code", monospace' }}>
                  📋 {t('detail.basicInfo')}
                </span>
              }
              size="small"
              style={{
                background: theme.cardBg,
                border: `1px solid ${theme.cardBorder}`,
              }}
            >
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label={t('detail.labels.taskId')} span={2}>
                  <Text code style={{ fontFamily: '"Fira Code", monospace' }}>
                    {currentTask.id}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label={t('detail.labels.status')}>
                  <Tag
                    icon={statusConfig.icon}
                    color={isDark ? undefined : 'default'}
                    style={{
                      background: isDark ? `${theme[`status${currentTask.status.charAt(0).toUpperCase()}${currentTask.status.slice(1)}` as keyof typeof theme] as string}20` : undefined,
                      color: isDark ? theme[`status${currentTask.status.charAt(0).toUpperCase()}${currentTask.status.slice(1)}` as keyof typeof theme] as string : undefined,
                    }}
                  >
                    {statusConfig.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label={t('detail.labels.currentPhase')}>
                  <Tag
                    style={{
                      fontFamily: '"Fira Code", monospace',
                      background: isDark ? `${getPhaseColor(currentTask.currentPhase, isDark)}20` : undefined,
                      color: getPhaseColor(currentTask.currentPhase, isDark),
                    }}
                  >
                    {currentTask.currentPhase.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label={t('detail.labels.repo')} span={2}>
                  <Space>
                    <GitlabOutlined />
                    <Text code style={{ fontFamily: '"Fira Code", monospace' }}>
                      {currentTask.repoName}
                    </Text>
                    <a
                      href={currentTask.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('detail.labels.viewRepo')}
                    </a>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label={t('detail.labels.issue')} span={2}>
                  <Space>
                    <BugOutlined />
                    <Text strong>#{currentTask.issueNumber}</Text>
                    <Text>{currentTask.issueTitle || t('detail.labels.noTitle')}</Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label={t('detail.labels.agent')}>
                  <Space>
                    <RobotOutlined />
                    <Text>{currentTask.agent?.name || '-'}</Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label={t('detail.labels.testStrategy')}>
                  <Tag>{currentTask.testStrategy}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label={t('detail.labels.maxRetries')}>
                  {currentTask.maxRetries}
                </Descriptions.Item>
                <Descriptions.Item label={t('detail.labels.autoFix')}>
                  {currentTask.autoFix ? (
                    <Tag color="success">{t('detail.labels.enabled')}</Tag>
                  ) : (
                    <Tag>{t('detail.labels.disabled')}</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label={t('detail.labels.fixAttempts')}>
                  {t('detail.labels.fixAttemptsCount', { count: currentTask.fixAttempts })}
                </Descriptions.Item>
                <Descriptions.Item label={t('detail.labels.progress')}>
                  {currentTask.progress}%
                </Descriptions.Item>
                <Descriptions.Item label={t('detail.labels.createdAt')} span={2}>
                  {dayjs(currentTask.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                {currentTask.startedAt && (
                  <Descriptions.Item label={t('detail.labels.startedAt')}>
                    {dayjs(currentTask.startedAt).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                )}
                {currentTask.completedAt && (
                  <Descriptions.Item label={t('detail.labels.completedAt')}>
                    {dayjs(currentTask.completedAt).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                )}
                {currentTask.duration && (
                  <Descriptions.Item label={t('detail.labels.executionTime')} span={2}>
                    {formatDuration(currentTask.duration, t)}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* Issue description - code panel style */}
            {currentTask.issueBody && (
              <Card
                title={
                  <span style={{ fontFamily: '"Fira Code", monospace' }}>
                    📝 {t('detail.issueDesc')}
                  </span>
                }
                size="small"
                style={{
                  background: theme.cardBg,
                  border: `1px solid ${theme.cardBorder}`,
                }}
              >
                <div style={issuePanelStyle}>
                  <Paragraph
                    ellipsis={{ rows: 8, expandable: true, symbol: t('detail.expandMore') }}
                    style={{
                      margin: 0,
                      fontFamily: '"Fira Code", monospace',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {currentTask.issueBody}
                  </Paragraph>
                </div>
              </Card>
            )}

            {/* Error info */}
            {currentTask.error && currentTask.status === 'failed' && (
              <Card
                title={
                  <span style={{ fontFamily: '"Fira Code", monospace', color: theme.statusFailed }}>
                    ✖ {t('detail.errorInfo')}
                  </span>
                }
                size="small"
                style={{
                  background: isDark ? 'rgba(255, 85, 85, 0.1)' : undefined,
                  border: `1px solid ${theme.statusFailed}`,
                }}
              >
                <Alert
                  type="error"
                  message={currentTask.error}
                  showIcon
                />
              </Card>
            )}

            {/* Phase flow */}
            <Card
              title={
                <span style={{ fontFamily: '"Fira Code", monospace' }}>
                  ⚙️ {t('detail.executionPhases')}
                </span>
              }
              size="small"
              style={{
                background: theme.cardBg,
                border: `1px solid ${theme.cardBorder}`,
              }}
            >
              <SWETaskPhases currentPhase={currentTask.currentPhase} />
            </Card>
          </Space>
        ),
      },
      {
        key: 'logs',
        label: (
          <span style={{ fontFamily: '"Fira Code", monospace' }}>
            📜 {t('detail.tabs.logs')}
            {connected && (
              <Tag
                color="success"
                style={{
                  marginLeft: 8,
                  fontFamily: '"Fira Code", monospace',
                  animation: 'neonPulse 2s ease-in-out infinite',
                }}
              >
                ● {t('detail.tabs.live')}
              </Tag>
            )}
          </span>
        ),
        children: (
          <TerminalLogViewer
            logs={taskLogs}
            loading={loading}
            maxHeight={600}
            autoScroll
            isConnected={connected}
          />
        ),
      },
      {
        key: 'result',
        label: (
          <span style={{ fontFamily: '"Fira Code", monospace' }}>
            ✅ {t('detail.tabs.result')}
          </span>
        ),
        children: (
          <TestResult
            result={currentTask.testResult}
            loading={loading}
          />
        ),
        disabled: !currentTask.testResult,
      },
      {
        key: 'history',
        label: (
          <span style={{ fontFamily: '"Fira Code", monospace' }}>
            🔀 {t('detail.tabs.history')}
          </span>
        ),
        children: (
          <Card
            size="small"
            style={{
              background: theme.cardBg,
              border: `1px solid ${theme.cardBorder}`,
            }}
          >
            <GitBranchVisualizer
              fixHistory={currentTask.fixHistory || []}
              currentPhase={currentTask.currentPhase}
            />
          </Card>
        ),
        disabled: !currentTask.fixHistory || currentTask.fixHistory.length === 0,
      },
    ];
  }, [currentTask, statusConfig, connected, taskLogs, loading, isDark, theme, issuePanelStyle, t]);

  // Action buttons
  const actionButtons = useMemo(() => {
    if (!currentTask) return null;

    const buttons = [];

    if (currentTask.status === 'running') {
      buttons.push(
        <Button
          key="cancel"
          danger
          icon={<StopOutlined />}
          onClick={handleCancel}
        >
          {t('detail.buttons.cancelTask')}
        </Button>
      );
    }

    if (currentTask.status === 'failed') {
      buttons.push(
        <Button
          key="retry"
          icon={<PlayCircleOutlined />}
          onClick={handleRetry}
        >
          {t('detail.buttons.rerun')}
        </Button>
      );
      if (currentTask.autoFix) {
        buttons.push(
          <Button
            key="fix"
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={handleFix}
          >
            {t('detail.buttons.autoFix')}
          </Button>
        );
      }
    }

    buttons.push(
      <Button
        key="export"
        icon={<CodeOutlined />}
        onClick={handleExport}
        disabled={currentTask.status !== 'completed'}
      >
        {t('detail.buttons.exportCode')}
      </Button>
    );

    return <Space>{buttons}</Space>;
  }, [currentTask, handleCancel, handleRetry, handleFix, handleExport, t]);

  // Loading state
  if (loading && !currentTask) {
    return (
      <div style={{ ...PAGE_STYLE, textAlign: 'center', paddingTop: 100 }}>
        <Spin size="large" tip={t('detail.loading')} />
      </div>
    );
  }

  // Empty state
  if (!currentTask) {
    return (
      <div style={PAGE_STYLE}>
        <Alert
          type="warning"
          message={t('detail.notFound')}
          showIcon
          action={
            <Button size="small" onClick={handleBack}>
              {t('detail.backToList')}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <>
      {/* Inject global styles */}
      <style>{getGlobalStyles(isDark)}</style>

      <div style={PAGE_STYLE}>
        {/* Breadcrumb */}
        <Breadcrumb
          style={{ marginBottom: 16 }}
          items={[
            { title: <HomeOutlined />, href: '/dashboard' },
            { title: <span>{t('detail.breadcrumbTasks')}</span>, href: '/swe' },
            { title: <span>{t('detail.breadcrumbDetail')}</span> },
          ]}
        />

        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
                {t('detail.back')}
              </Button>
              <Title
                level={2}
                style={{
                  margin: 0,
                  color: isDark ? theme.syntaxVariable : theme.textPrimary,
                  ...(isDark && { textShadow: theme.codeGlow }),
                }}
              >
                <BugOutlined style={{ marginRight: 12 }} />
                {currentTask.repoName} #{currentTask.issueNumber}
              </Title>
              <Tag
                icon={statusConfig.icon}
                style={{
                  fontFamily: '"Fira Code", monospace',
                  background: isDark ? `${theme[`status${currentTask.status.charAt(0).toUpperCase()}${currentTask.status.slice(1)}` as keyof typeof theme] as string}20` : undefined,
                  color: isDark ? theme[`status${currentTask.status.charAt(0).toUpperCase()}${currentTask.status.slice(1)}` as keyof typeof theme] as string : undefined,
                }}
              >
                {statusConfig.label}
              </Tag>
              {connected && (
                <Tag
                  color="success"
                  style={{
                    fontFamily: '"Fira Code", monospace',
                    animation: 'neonPulse 2s ease-in-out infinite',
                  }}
                >
                  ● {t('detail.live')}
                </Tag>
              )}
            </Space>
            <Space>
              {actionButtons}
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={refreshing}
              >
                {t('detail.refresh')}
              </Button>
            </Space>
          </div>
          {currentTask.issueTitle && (
            <Text style={{ marginLeft: 92, color: theme.textSecondary }}>
              {currentTask.issueTitle}
            </Text>
          )}
        </div>

        {/* Running state notice */}
        {currentTask.status === 'running' && (
          <Alert
            message={
              <span style={{ fontFamily: '"Fira Code", monospace' }}>
                {t('detail.runningTitle')}
              </span>
            }
            description={t('detail.runningDesc')}
            type="info"
            showIcon
            icon={<LoadingOutlined />}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{
            background: isDark ? theme.cardBg : undefined,
            padding: isDark ? '16px' : undefined,
            borderRadius: isDark ? 8 : undefined,
            border: isDark ? `1px solid ${theme.cardBorder}` : undefined,
          }}
        />
      </div>
    </>
  );
}

// Helper function to get phase color
function getPhaseColor(phase: string, isDark: boolean): string {
  const colors: Record<string, { light: string; dark: string }> = {
    idle: { light: '#d9d9d9', dark: '#6b7280' },
    cloning: { light: '#1890ff', dark: '#8be9fd' },
    setup: { light: '#52c41a', dark: '#50fa7b' },
    analyzing: { light: '#722ed1', dark: '#bd93f9' },
    fixing: { light: '#fa8c16', dark: '#ffb86c' },
    testing: { light: '#13c2c2', dark: '#ff79c6' },
    verifying: { light: '#eb2f96', dark: '#8be9fd' },
    completed: { light: '#52c41a', dark: '#50fa7b' },
    failed: { light: '#ff4d4f', dark: '#ff5555' },
  };
  const colorKey = isDark ? 'dark' : 'light';
  return colors[phase]?.[colorKey] || colors.idle[colorKey];
}

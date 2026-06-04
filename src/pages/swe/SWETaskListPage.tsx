/**
 * SWE task list page - "Code Terminal Command Center" style
 * Dark mode: cyber-tech aesthetic, code rain background, neon borders
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Input,
  Select,
  Empty,
  Spin,
  Breadcrumb,
  message,
} from 'antd';
import {
  HomeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  BugOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { useSWEStore, useSWETasksCount, useSWELoading } from '@/stores';
import { CodeBackground } from './components/CodeBackground';
import { SWETaskTile } from './components/SWETaskTile';
import { HolographicStatsPanel } from '@/pages/batch/components/HolographicStatsPanel';
import { useIsDark } from '@/theme';
import { getSWETheme, getGlobalStyles } from './theme';
import { useSWEPageContainerStyle, useFilterBarStyle, useSWETaskGridStyle } from './style';
import type { SWETaskStatus } from '@/types';

const { Title, Text } = Typography;

// Status options
const STATUS_OPTIONS: { value: SWETaskStatus; label: string; icon: React.ReactNode }[] = [
  { value: 'pending', get label() { return i18next.t('swe:list.statusPending'); }, icon: '⏳' },
  { value: 'running', get label() { return i18next.t('swe:list.statusRunning'); }, icon: '⚡' },
  { value: 'completed', get label() { return i18next.t('swe:list.statusCompleted'); }, icon: '✅' },
  { value: 'failed', get label() { return i18next.t('swe:list.statusFailed'); }, icon: '❌' },
  { value: 'cancelled', get label() { return i18next.t('swe:list.statusCancelled'); }, icon: '⏹️' },
];

export default function SWETaskListPage() {
  const { t } = useTranslation('swe');
  const navigate = useNavigate();
  const tasks = useSWEStore((state) => state.tasks);
  const fetchTasks = useSWEStore((state) => state.fetchTasks);
  const loading = useSWELoading();
  const stats = useSWETasksCount();
  const isDark = useIsDark();
  const theme = getSWETheme(isDark);

  // Local filter state
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<SWETaskStatus[]>([]);
  const [repoFilter, setRepoFilter] = useState<string[]>([]);

  // Style hooks
  const containerStyle = useSWEPageContainerStyle();
  const filterBarStyle = useFilterBarStyle();
  const gridStyle = useSWETaskGridStyle();

  // Load data
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchTasks();
    message.success(t('list.refreshed'));
  }, [fetchTasks, t]);

  // Handle create
  const handleCreate = useCallback(() => {
    navigate('/swe/create');
  }, [navigate]);

  // Handle view detail
  const handleViewDetail = useCallback((taskId: string) => {
    navigate(`/swe/${taskId}`);
  }, [navigate]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      if (searchValue) {
        const searchLower = searchValue.toLowerCase();
        const matchSearch =
          task.repoName?.toLowerCase().includes(searchLower) ||
          task.issueTitle?.toLowerCase().includes(searchLower) ||
          task.repoUrl?.toLowerCase().includes(searchLower) ||
          String(task.issueNumber).includes(searchLower);
        if (!matchSearch) return false;
      }

      // Status filter
      if (statusFilter.length > 0 && !statusFilter.includes(task.status)) {
        return false;
      }

      // Repo filter
      if (repoFilter.length > 0 && !repoFilter.includes(task.repoName)) {
        return false;
      }

      return true;
    });
  }, [tasks, searchValue, statusFilter, repoFilter]);

  // Unique repo list
  const repoList = useMemo(() => {
    return Array.from(new Set(tasks.map((t) => t.repoName).filter(Boolean)));
  }, [tasks]);

  // Title style
  const titleStyle = useMemo(() => ({
    fontSize: 28,
    fontWeight: 700,
    color: isDark ? theme.syntaxVariable : theme.textPrimary,
    margin: 0,
    ...(isDark && {
      textShadow: theme.codeGlow,
    }),
  }), [isDark, theme]);

  const subtitleStyle = useMemo(() => ({
    fontSize: 14,
    color: theme.textSecondary,
  }), [theme]);

  return (
    <>
      {/* Code rain background - dark mode only */}
      <CodeBackground density={25} />

      {/* Inject global styles */}
      <style>{getGlobalStyles(isDark)}</style>

      <div style={containerStyle}>
        {/* Breadcrumb */}
        <Breadcrumb
          style={{ marginBottom: 24 }}
          items={[
            { title: <HomeOutlined />, href: '/dashboard' },
            { title: <span>{t('list.breadcrumbTasks')}</span> },
          ]}
        />

        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Title level={2} style={titleStyle}>
                <BugOutlined style={{ marginRight: 12 }} />
                {t('list.title')}
              </Title>
              <Text style={subtitleStyle}>
                {t('list.subtitle')}
              </Text>
            </div>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
              >
                {t('list.refresh')}
              </Button>
              <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleCreate}>
                {t('list.createTask')}
              </Button>
            </Space>
          </div>
        </div>

        {/* Stats overview - holographic panel */}
        <HolographicStatsPanel stats={stats} />

        {/* Filter bar */}
        <Card
          size="small"
          style={filterBarStyle}
          styles={{ body: { padding: '12px 16px' } }}
        >
          <Space wrap size={12}>
            <Input
              prefix={<SearchOutlined />}
              placeholder={t('list.searchPlaceholder')}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              allowClear
              style={{ width: 280 }}
            />
            <Select
              mode="multiple"
              placeholder={t('list.statusFilter')}
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS.map((s) => ({
                label: (
                  <Space>
                    {s.icon}
                    {s.label}
                  </Space>
                ),
                value: s.value,
              }))}
              style={{ minWidth: 160 }}
              allowClear
            />
            <Select
              mode="multiple"
              placeholder={t('list.repoFilter')}
              value={repoFilter}
              onChange={setRepoFilter}
              options={repoList.map((r) => ({ label: r, value: r }))}
              style={{ minWidth: 160 }}
              allowClear
            />
            {(searchValue || statusFilter.length > 0 || repoFilter.length > 0) && (
              <Button
                size="small"
                onClick={() => {
                  setSearchValue('');
                  setStatusFilter([]);
                  setRepoFilter([]);
                }}
              >
                {t('list.clearFilter')}
              </Button>
            )}
          </Space>
          {filteredTasks.length > 0 && (
            <Text type="secondary" style={{ float: 'right', lineHeight: '32px' }}>
              {t('list.totalItems', { count: filteredTasks.length })}
            </Text>
          )}
        </Card>

        {/* Task list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" tip={t('list.loading')} />
          </div>
        ) : filteredTasks.length === 0 ? (
          <Card style={{
            borderRadius: isDark ? 0 : 12,
            textAlign: 'center',
            padding: 60,
            background: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
          }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                tasks.length === 0
                  ? t('list.noTasks')
                  : t('list.noMatch')
              }
            >
              {tasks.length === 0 && (
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  {t('list.createFirst')}
                </Button>
              )}
            </Empty>
          </Card>
        ) : (
          <div style={gridStyle}>
            {filteredTasks.map((task, index) => (
              <SWETaskTile
                key={task.id}
                task={task}
                onClick={() => handleViewDetail(task.id)}
                delay={Math.min(index * 0.05, 0.5)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Input,
  List,
  Modal,
  Pagination,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Statistic,
  Tag,
  Tabs,
  Typography,
  message,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  ReloadOutlined,
  RetweetOutlined,
  SendOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useNotificationPageStore } from './store';
import { useIsDark, useThemeTokens, type ThemeTokens } from '@/theme';
import type { DeadLetterEntry, Notification } from '@/types/notification';

const { RangePicker } = DatePicker;
const { Search } = Input;
const { Title, Paragraph, Text } = Typography;

dayjs.extend(relativeTime);

type HistoryFilterQuickValue = 'all' | 'pending' | 'acked' | 'rejected';

type DateRangeValue = [Dayjs, Dayjs] | null;

type NotificationPageStyles = Record<
  | 'page'
  | 'hero'
  | 'heroTexture'
  | 'heroTitle'
  | 'heroText'
  | 'summaryCard'
  | 'summaryIcon'
  | 'summaryTitle'
  | 'panelCard'
  | 'batchCard'
  | 'recordCard'
  | 'recordTitle'
  | 'recordMessage'
  | 'metaBlock'
  | 'checkboxPlaceholder'
  | 'inlineDivider'
  | 'paginationCard',
  CSSProperties
>;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function renderSummaryCard(
  styles: NotificationPageStyles,
  title: string,
  value: number,
  icon: ReactNode,
  accent: string,
  subtitle: string,
) {
  return (
    <Card style={styles.summaryCard}>
      <Space direction="vertical" size={6} style={{ width: '100%' }}>
        <Space size={12} align="center">
          <span style={{ ...styles.summaryIcon, color: accent, background: `${accent}14` }}>{icon}</span>
          <Text style={styles.summaryTitle}>{title}</Text>
        </Space>
        <Statistic value={value} valueStyle={{ color: accent, fontSize: 28, fontWeight: 700 }} />
        <Text type="secondary">{subtitle}</Text>
      </Space>
    </Card>
  );
}

function formatTime(value?: string) {
  if (!value) {
    return '-';
  }

  const time = dayjs(value);
  if (!time.isValid()) {
    return value;
  }

  return `${time.format('YYYY-MM-DD HH:mm:ss')} · ${time.fromNow()}`;
}

function statusColor(notification: Notification) {
  if (notification.ackStatus === 'acked') {
    return 'green';
  }
  if (notification.ackStatus === 'rejected') {
    return 'red';
  }
  return 'gold';
}

function deliveryColor(status: string) {
  if (status === 'sent') {
    return 'blue';
  }
  if (status === 'failed') {
    return 'red';
  }
  if (status === 'dropped') {
    return 'default';
  }
  return 'processing';
}

function toneAccent(type: Notification['type'], tokens: ThemeTokens) {
  if (type === 'error' || type === 'dlq') {
    return tokens.status.error;
  }
  if (type === 'success') {
    return tokens.status.success;
  }
  if (type === 'warning') {
    return tokens.status.warning;
  }
  if (type === 'system') {
    return tokens.status.info;
  }
  return tokens.text.tertiary;
}

function NotificationCard({
  item,
  checked,
  onToggle,
  onView,
  onAcknowledge,
  onReject,
  t,
  styles,
  tokens,
}: {
  item: Notification;
  checked: boolean;
  onToggle: (id: string) => void;
  onView: (id: string) => void;
  onAcknowledge: (id: string) => void;
  onReject: (id: string) => void;
  t: TFunction;
  styles: NotificationPageStyles;
  tokens: ThemeTokens;
}) {
  const accent = toneAccent(item.type, tokens);

  return (
    <Card
      style={{
        ...styles.recordCard,
        borderColor: checked ? accent : styles.recordCard.borderColor,
        boxShadow: checked ? `0 0 0 1px ${accent}33, ${styles.recordCard.boxShadow}` : styles.recordCard.boxShadow,
      }}
      styles={{ body: { padding: 20 } }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space align="start" size={12}>
            {item.ackStatus === 'pending' ? (
              <Checkbox checked={checked} onChange={() => onToggle(item.id)} />
            ) : (
              <span style={styles.checkboxPlaceholder} />
            )}
            <Space direction="vertical" size={4}>
              <Text style={styles.recordTitle}>{item.title}</Text>
              <Space size={[8, 8]} wrap>
                <Tag color={statusColor(item)}>
                  {item.ackStatus === 'pending'
                    ? t('ackStatus.pending')
                    : item.ackStatus === 'acked'
                      ? t('ackStatus.acked')
                      : t('ackStatus.rejected')}
                </Tag>
                <Tag color={deliveryColor(item.deliveryStatus)}>
                  {t('history.deliveryPrefix', { status: item.deliveryStatus })}
                </Tag>
                <Tag>{item.channel}</Tag>
                <Tag>{item.priority}</Tag>
                <Tag>{item.eventType}</Tag>
              </Space>
            </Space>
          </Space>
          <Text type="secondary" style={{ textAlign: 'right' }}>
            {formatTime(item.timestamp)}
          </Text>
        </Space>

        <Paragraph
          style={styles.recordMessage}
          ellipsis={{ rows: 3, expandable: true, symbol: t('history.expand') }}
        >
          {item.content || t('history.noContent')}
        </Paragraph>

        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <div style={styles.metaBlock}>
              <Text type="secondary">{t('history.taskId')}</Text>
              <Text>{item.taskId || '-'}</Text>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={styles.metaBlock}>
              <Text type="secondary">Worker ID</Text>
              <Text>{item.workerId || '-'}</Text>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={styles.metaBlock}>
              <Text type="secondary">{t('history.durationRetries')}</Text>
              <Text>
                {item.durationMs} ms / {item.retries}
              </Text>
            </div>
          </Col>
        </Row>

        {item.error ? (
          <Alert
            type="error"
            showIcon
            message={t('history.deliveryError')}
            description={item.error}
            style={{ borderRadius: 14 }}
          />
        ) : null}

        <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <Space wrap>
            <Button icon={<EyeOutlined />} onClick={() => onView(item.id)}>
              {t('history.viewDetail')}
            </Button>
            {item.ackStatus === 'pending' ? (
              <>
                <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => onAcknowledge(item.id)}>
                  {t('history.ack')}
                </Button>
                <Button danger icon={<CloseCircleOutlined />} onClick={() => onReject(item.id)}>
                  {t('history.reject')}
                </Button>
              </>
            ) : null}
          </Space>
          <Space split={<span style={styles.inlineDivider}>|</span>} size={12}>
            <Text type="secondary">{t('history.ackedBy', { user: item.ackedBy || '-' })}</Text>
            <Text type="secondary">
              {t('history.ackedAt', {
                time: item.ackedAt ? dayjs(item.ackedAt).format('MM-DD HH:mm') : '-',
              })}
            </Text>
          </Space>
        </Space>
      </Space>
    </Card>
  );
}

function DeadLetterCard({
  item,
  onView,
  onReplay,
  onRemove,
  t,
  styles,
  tokens,
}: {
  item: DeadLetterEntry;
  onView: (id: string) => void;
  onReplay: (id: string) => void;
  onRemove: (id: string) => void;
  t: TFunction;
  styles: NotificationPageStyles;
  tokens: ThemeTokens;
}) {
  const accent = tokens.status.error;

  return (
    <Card
      style={{
        ...styles.recordCard,
        borderColor: accent,
        boxShadow: `0 0 0 1px ${accent}26, ${styles.recordCard.boxShadow}`,
      }}
      styles={{ body: { padding: 20 } }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space direction="vertical" size={4}>
            <Text style={styles.recordTitle}>{item.title}</Text>
            <Space size={[8, 8]} wrap>
              <Tag color="red">{t('dlq.dlqTag')}</Tag>
              {item.source ? <Tag>{item.source}</Tag> : null}
              {item.event?.type ? <Tag>{item.event.type}</Tag> : null}
              {item.event?.priority ? <Tag>{item.event.priority}</Tag> : null}
            </Space>
          </Space>
          <Text type="secondary">{formatTime(item.failedAt)}</Text>
        </Space>

        <Paragraph
          style={styles.recordMessage}
          ellipsis={{ rows: 3, expandable: true, symbol: t('history.expand') }}
        >
          {item.content}
        </Paragraph>

        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <div style={styles.metaBlock}>
              <Text type="secondary">{t('history.taskId')}</Text>
              <Text>{item.event?.taskId || '-'}</Text>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={styles.metaBlock}>
              <Text type="secondary">Worker ID</Text>
              <Text>{item.event?.workerId || '-'}</Text>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={styles.metaBlock}>
              <Text type="secondary">{t('dlq.reason')}</Text>
              <Text>{item.reason || '-'}</Text>
            </div>
          </Col>
        </Row>

        <Space wrap>
          <Button icon={<EyeOutlined />} onClick={() => onView(item.id)}>
            {t('dlq.viewDetail')}
          </Button>
          <Button type="primary" icon={<RetweetOutlined />} onClick={() => onReplay(item.id)}>
            {t('dlq.replay')}
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={() => onRemove(item.id)}>
            {t('dlq.delete')}
          </Button>
        </Space>
      </Space>
    </Card>
  );
}

function NotificationPage() {
  const { t } = useTranslation('notifications');
  const tokens = useThemeTokens();
  const isDark = useIsDark();
  const styles = useMemo(() => createNotificationStyles(tokens, isDark), [isDark, tokens]);
  const notifications = useNotificationPageStore((state) => state.notifications);
  const total = useNotificationPageStore((state) => state.total);
  const page = useNotificationPageStore((state) => state.page);
  const pageSize = useNotificationPageStore((state) => state.pageSize);
  const pendingCount = useNotificationPageStore((state) => state.pendingCount);
  const stats = useNotificationPageStore((state) => state.stats);
  const selectedIds = useNotificationPageStore((state) => state.selectedIds);
  const loading = useNotificationPageStore((state) => state.loading);
  const detailLoading = useNotificationPageStore((state) => state.detailLoading);
  const exporting = useNotificationPageStore((state) => state.exporting);
  const error = useNotificationPageStore((state) => state.error);
  const activeTab = useNotificationPageStore((state) => state.activeTab);
  const activeNotification = useNotificationPageStore((state) => state.activeNotification);
  const filters = useNotificationPageStore((state) => state.filters);
  const dlqEntries = useNotificationPageStore((state) => state.dlqEntries);
  const dlqTotal = useNotificationPageStore((state) => state.dlqTotal);
  const dlqPage = useNotificationPageStore((state) => state.dlqPage);
  const dlqPageSize = useNotificationPageStore((state) => state.dlqPageSize);
  const dlqCount = useNotificationPageStore((state) => state.dlqCount);
  const dlqLoading = useNotificationPageStore((state) => state.dlqLoading);
  const activeDeadLetter = useNotificationPageStore((state) => state.activeDeadLetter);
  const dlqFilters = useNotificationPageStore((state) => state.dlqFilters);

  const initialize = useNotificationPageStore((state) => state.initialize);
  const refreshHistory = useNotificationPageStore((state) => state.refreshHistory);
  const refreshSummaries = useNotificationPageStore((state) => state.refreshSummaries);
  const setActiveTab = useNotificationPageStore((state) => state.setActiveTab);
  const setFilters = useNotificationPageStore((state) => state.setFilters);
  const setPage = useNotificationPageStore((state) => state.setPage);
  const toggleSelection = useNotificationPageStore((state) => state.toggleSelection);
  const selectAllVisible = useNotificationPageStore((state) => state.selectAllVisible);
  const clearSelection = useNotificationPageStore((state) => state.clearSelection);
  const openNotification = useNotificationPageStore((state) => state.openNotification);
  const closeNotification = useNotificationPageStore((state) => state.closeNotification);
  const acknowledge = useNotificationPageStore((state) => state.acknowledge);
  const reject = useNotificationPageStore((state) => state.reject);
  const bulkAcknowledge = useNotificationPageStore((state) => state.bulkAcknowledge);
  const exportHistory = useNotificationPageStore((state) => state.exportHistory);
  const refreshDLQ = useNotificationPageStore((state) => state.refreshDLQ);
  const setDLQFilters = useNotificationPageStore((state) => state.setDLQFilters);
  const setDLQPage = useNotificationPageStore((state) => state.setDLQPage);
  const openDeadLetter = useNotificationPageStore((state) => state.openDeadLetter);
  const closeDeadLetter = useNotificationPageStore((state) => state.closeDeadLetter);
  const replayDeadLetter = useNotificationPageStore((state) => state.replayDeadLetter);
  const removeDeadLetter = useNotificationPageStore((state) => state.removeDeadLetter);

  const [historySearch, setHistorySearch] = useState(filters.search ?? '');
  const [dlqSearch, setDlqSearch] = useState(dlqFilters.search ?? '');

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    setHistorySearch(filters.search ?? '');
  }, [filters.search]);

  useEffect(() => {
    setDlqSearch(dlqFilters.search ?? '');
  }, [dlqFilters.search]);

  const historyQuickValue = useMemo<HistoryFilterQuickValue>(() => {
    if (!filters.ackStatuses || filters.ackStatuses.length === 0) {
      return 'all';
    }
    if (filters.ackStatuses.length === 1) {
      return filters.ackStatuses[0];
    }
    return 'all';
  }, [filters.ackStatuses]);

  const historyRange = useMemo<DateRangeValue>(() => {
    if (!filters.startTime || !filters.endTime) {
      return null;
    }
    return [dayjs(filters.startTime), dayjs(filters.endTime)];
  }, [filters.endTime, filters.startTime]);

  const dlqRange = useMemo<DateRangeValue>(() => {
    if (!dlqFilters.startTime || !dlqFilters.endTime) {
      return null;
    }
    return [dayjs(dlqFilters.startTime), dayjs(dlqFilters.endTime)];
  }, [dlqFilters.endTime, dlqFilters.startTime]);

  const eventTypeOptions = useMemo(
    () =>
      Object.entries(stats?.byEventType ?? {})
        .sort((left, right) => right[1] - left[1])
        .map(([value, count]) => ({ label: `${value} (${count})`, value })),
    [stats?.byEventType],
  );

  const channelOptions = useMemo(
    () =>
      Object.entries(stats?.byChannel ?? {})
        .sort((left, right) => right[1] - left[1])
        .map(([value, count]) => ({ label: `${value} (${count})`, value })),
    [stats?.byChannel],
  );

  const priorityOptions = useMemo(
    () =>
      Object.entries(stats?.byPriority ?? {})
        .sort((left, right) => right[1] - left[1])
        .map(([value, count]) => ({ label: `${value} (${count})`, value })),
    [stats?.byPriority],
  );

  const deliveryStatusOptions = useMemo(
    () =>
      Object.entries(stats?.byStatus ?? {})
        .sort((left, right) => right[1] - left[1])
        .map(([value, count]) => ({ label: `${value} (${count})`, value })),
    [stats?.byStatus],
  );

  const dlqSourceOptions = useMemo(
    () =>
      Array.from(new Set(dlqEntries.map((entry) => entry.source).filter(Boolean) as string[])).map((value) => ({
        label: value,
        value,
      })),
    [dlqEntries],
  );

  const pendingVisibleCount = useMemo(
    () => notifications.filter((item) => item.ackStatus === 'pending').length,
    [notifications],
  );

  const handleExport = useCallback(
    async (format: 'json' | 'csv') => {
      const blob = await exportHistory(format);
      const now = dayjs().format('YYYYMMDD-HHmmss');
      downloadBlob(blob, `history-${now}.${format}`);
      message.success(t('page.exportSuccess', { format: format.toUpperCase() }));
    },
    [exportHistory, t],
  );

  const handleRefreshCurrentTab = useCallback(async () => {
    if (activeTab === 'history') {
      await Promise.all([refreshHistory(), refreshSummaries()]);
    } else {
      await Promise.all([refreshDLQ(), refreshSummaries()]);
    }
    message.success(t('page.dataRefreshed'));
  }, [activeTab, refreshDLQ, refreshHistory, refreshSummaries, t]);

  const askForComment = useCallback(
    (title: string, onSubmit: (comment?: string) => Promise<void>) => {
      let comment = '';
      Modal.confirm({
        title,
        width: 520,
        okText: t('history.askComment.submit'),
        cancelText: t('history.askComment.cancel'),
        content: (
          <Input.TextArea
            rows={4}
            placeholder={t('history.askComment.placeholder')}
            onChange={(event) => {
              comment = event.target.value;
            }}
          />
        ),
        onOk: async () => {
          await onSubmit(comment.trim() || undefined);
        },
      });
    },
    [t],
  );

  const handleBulkAcknowledge = useCallback(() => {
    askForComment(t('history.bulkAckTitle', { count: selectedIds.length }), async (comment) => {
      await bulkAcknowledge(comment);
      message.success(t('history.bulkAckOk'));
    });
  }, [askForComment, bulkAcknowledge, selectedIds.length, t]);

  const historyTabContent = (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card style={styles.panelCard}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
            <Segmented
              value={historyQuickValue}
              onChange={(value) =>
                void setFilters({
                  ackStatuses: value === 'all' ? undefined : [value as Notification['ackStatus']],
                })
              }
              options={[
                { label: t('history.filters.all'), value: 'all' },
                { label: t('history.filters.pending'), value: 'pending' },
                { label: t('history.filters.acked'), value: 'acked' },
                { label: t('history.filters.rejected'), value: 'rejected' },
              ]}
            />
            <Space wrap>
              <Button onClick={() => void selectAllVisible()} disabled={pendingVisibleCount === 0}>
                {t('history.filters.selectPending')}
              </Button>
              <Button onClick={() => clearSelection()} disabled={selectedIds.length === 0}>
                {t('history.filters.clearSelection')}
              </Button>
              <Button
                onClick={() =>
                  void setFilters({
                    search: undefined,
                    eventTypes: undefined,
                    channels: undefined,
                    priorities: undefined,
                    statuses: undefined,
                    ackStatuses: undefined,
                    taskId: undefined,
                    workerId: undefined,
                    startTime: undefined,
                    endTime: undefined,
                  })
                }
              >
                {t('history.filters.resetFilters')}
              </Button>
            </Space>
          </Space>

          <Row gutter={[16, 16]}>
            <Col xs={24} xl={10}>
              <Search
                allowClear
                value={historySearch}
                placeholder={t('history.filters.searchPlaceholder')}
                enterButton={t('history.filters.searchEnter')}
                onChange={(event) => setHistorySearch(event.target.value)}
                onSearch={(value) => void setFilters({ search: value || undefined })}
              />
            </Col>
            <Col xs={24} md={12} xl={7}>
              <Select
                mode="multiple"
                allowClear
                value={filters.eventTypes}
                options={eventTypeOptions}
                placeholder={t('history.filters.eventTypes')}
                style={{ width: '100%' }}
                onChange={(value) => void setFilters({ eventTypes: value.length > 0 ? value : undefined })}
              />
            </Col>
            <Col xs={24} md={12} xl={7}>
              <Select
                mode="multiple"
                allowClear
                value={filters.channels}
                options={channelOptions}
                placeholder={t('history.filters.channels')}
                style={{ width: '100%' }}
                onChange={(value) => void setFilters({ channels: value.length > 0 ? value : undefined })}
              />
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Select
                mode="multiple"
                allowClear
                value={filters.priorities}
                options={priorityOptions}
                placeholder={t('history.filters.priorities')}
                style={{ width: '100%' }}
                onChange={(value) => void setFilters({ priorities: value.length > 0 ? value : undefined })}
              />
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Select
                mode="multiple"
                allowClear
                value={filters.statuses}
                options={deliveryStatusOptions}
                placeholder={t('history.filters.deliveryStatuses')}
                style={{ width: '100%' }}
                onChange={(value) => void setFilters({ statuses: value.length > 0 ? value : undefined })}
              />
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Input
                allowClear
                value={filters.taskId}
                placeholder={t('history.filters.taskIdPlaceholder')}
                onChange={(event) => void setFilters({ taskId: event.target.value || undefined })}
              />
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Input
                allowClear
                value={filters.workerId}
                placeholder={t('history.filters.workerIdPlaceholder')}
                onChange={(event) => void setFilters({ workerId: event.target.value || undefined })}
              />
            </Col>
            <Col xs={24} xl={8}>
              <RangePicker
                showTime
                style={{ width: '100%' }}
                value={historyRange}
                onChange={(value) =>
                  void setFilters({
                    startTime: value?.[0]?.toISOString(),
                    endTime: value?.[1]?.toISOString(),
                  })
                }
              />
            </Col>
          </Row>
        </Space>
      </Card>

      {selectedIds.length > 0 ? (
        <Card style={styles.batchCard}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
            <Text>
              {t('history.batchBar.selectedPrefix')}
              <Text strong>{selectedIds.length}</Text>
              {t('history.batchBar.selectedSuffix')}
            </Text>
            <Space wrap>
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleBulkAcknowledge}>
                {t('history.batchBar.batchAck')}
              </Button>
              <Button onClick={() => clearSelection()}>{t('history.batchBar.cancelSelection')}</Button>
            </Space>
          </Space>
        </Card>
      ) : null}

      <Spin spinning={loading}>
        {notifications.length === 0 ? (
          <Card style={styles.panelCard}>
            <Paragraph style={{ marginBottom: 0 }}>{t('history.empty')}</Paragraph>
          </Card>
        ) : (
          <List
            dataSource={notifications}
            grid={{ gutter: 16, xs: 1, lg: 1, xl: 2 }}
            renderItem={(item) => (
              <List.Item>
                <NotificationCard
                  item={item}
                  checked={selectedIds.includes(item.id)}
                  onToggle={toggleSelection}
                  onView={(id) => void openNotification(id)}
                  onAcknowledge={(id) =>
                    askForComment(t('history.ackTitle'), async (comment) => {
                      await acknowledge(id, comment);
                      message.success(t('history.ackOk'));
                    })
                  }
                  onReject={(id) =>
                    askForComment(t('history.rejectTitle'), async (comment) => {
                      await reject(id, comment);
                      message.success(t('history.rejectOk'));
                    })
                  }
                  t={t}
                  styles={styles}
                  tokens={tokens}
                />
              </List.Item>
            )}
          />
        )}
      </Spin>

      <Card style={styles.paginationCard}>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          showSizeChanger
          showTotal={(value) => t('history.paginationTotal', { count: value })}
          onChange={(nextPage, nextPageSize) => void setPage(nextPage, nextPageSize)}
        />
      </Card>
    </Space>
  );

  const dlqTabContent = (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card style={styles.panelCard}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            type="warning"
            showIcon
            message={t('dlq.alertTitle')}
            description={t('dlq.alertDesc')}
            style={{ borderRadius: 14 }}
          />

          <Row gutter={[16, 16]}>
            <Col xs={24} xl={10}>
              <Search
                allowClear
                value={dlqSearch}
                placeholder={t('dlq.searchPlaceholder')}
                enterButton={t('dlq.searchEnter')}
                onChange={(event) => setDlqSearch(event.target.value)}
                onSearch={(value) => void setDLQFilters({ search: value || undefined })}
              />
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Select
                allowClear
                value={dlqFilters.source}
                options={dlqSourceOptions}
                placeholder={t('dlq.source')}
                style={{ width: '100%' }}
                onChange={(value) => void setDLQFilters({ source: value || undefined })}
              />
            </Col>
            <Col xs={24} md={12} xl={4}>
              <Input
                allowClear
                value={dlqFilters.taskId}
                placeholder={t('dlq.taskIdPlaceholder')}
                onChange={(event) => void setDLQFilters({ taskId: event.target.value || undefined })}
              />
            </Col>
            <Col xs={24} md={12} xl={4}>
              <Input
                allowClear
                value={dlqFilters.workerId}
                placeholder={t('dlq.workerIdPlaceholder')}
                onChange={(event) => void setDLQFilters({ workerId: event.target.value || undefined })}
              />
            </Col>
            <Col xs={24} xl={8}>
              <RangePicker
                showTime
                style={{ width: '100%' }}
                value={dlqRange}
                onChange={(value) =>
                  void setDLQFilters({
                    startTime: value?.[0]?.toISOString(),
                    endTime: value?.[1]?.toISOString(),
                  })
                }
              />
            </Col>
          </Row>
        </Space>
      </Card>

      <Spin spinning={dlqLoading}>
        {dlqEntries.length === 0 ? (
          <Card style={styles.panelCard}>
            <Paragraph style={{ marginBottom: 0 }}>{t('dlq.empty')}</Paragraph>
          </Card>
        ) : (
          <List
            dataSource={dlqEntries}
            grid={{ gutter: 16, xs: 1, lg: 1, xl: 2 }}
            renderItem={(item) => (
              <List.Item>
                <DeadLetterCard
                  item={item}
                  onView={(id) => void openDeadLetter(id)}
                  onReplay={(id) =>
                    Modal.confirm({
                      title: t('dlq.replayConfirmTitle'),
                      content: t('dlq.replayConfirmContent'),
                      okText: t('dlq.replayOkText'),
                      cancelText: t('dlq.replayCancel'),
                      onOk: async () => {
                        await replayDeadLetter(id);
                        message.success(t('dlq.replaySuccess'));
                      },
                    })
                  }
                  onRemove={(id) =>
                    Modal.confirm({
                      title: t('dlq.deleteConfirmTitle'),
                      content: t('dlq.deleteConfirmContent'),
                      okText: t('dlq.deleteOkText'),
                      cancelText: t('dlq.deleteCancel'),
                      okButtonProps: { danger: true },
                      onOk: async () => {
                        await removeDeadLetter(id);
                        message.success(t('dlq.deleteSuccess'));
                      },
                    })
                  }
                  t={t}
                  styles={styles}
                  tokens={tokens}
                />
              </List.Item>
            )}
          />
        )}
      </Spin>

      <Card style={styles.paginationCard}>
        <Pagination
          current={dlqPage}
          pageSize={dlqPageSize}
          total={dlqTotal}
          showSizeChanger
          showTotal={(value) => t('history.paginationTotal', { count: value })}
          onChange={(nextPage, nextPageSize) => void setDLQPage(nextPage, nextPageSize)}
        />
      </Card>
    </Space>
  );

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div style={styles.heroTexture} />
        <Space direction="vertical" size={18} style={{ width: '100%', position: 'relative' }}>
          <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }} wrap>
            <Space direction="vertical" size={6}>
              <Badge color={tokens.brand.primary} text={t('page.heroBadge')} />
              <Title level={2} style={styles.heroTitle}>
                {t('page.heroTitle')}
              </Title>
              <Paragraph style={styles.heroText}>{t('page.heroDesc')}</Paragraph>
            </Space>
            <Space wrap>
              <Button icon={<ReloadOutlined />} onClick={() => void handleRefreshCurrentTab()}>
                {t('page.refresh')}
              </Button>
              <Button icon={<DownloadOutlined />} loading={exporting} onClick={() => void handleExport('json')}>
                {t('page.exportJson')}
              </Button>
              <Button icon={<DownloadOutlined />} loading={exporting} onClick={() => void handleExport('csv')}>
                {t('page.exportCsv')}
              </Button>
            </Space>
          </Space>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} xl={8} xxl={4}>
              {renderSummaryCard(
                styles,
                t('summary.pending'),
                pendingCount,
                <ClockCircleOutlined />,
                tokens.status.warning,
                t('summary.pendingDesc'),
              )}
            </Col>
            <Col xs={24} md={12} xl={8} xxl={4}>
              {renderSummaryCard(
                styles,
                t('summary.acknowledged'),
                stats?.acknowledged ?? 0,
                <CheckCircleOutlined />,
                tokens.status.success,
                t('summary.acknowledgedDesc'),
              )}
            </Col>
            <Col xs={24} md={12} xl={8} xxl={4}>
              {renderSummaryCard(
                styles,
                t('summary.rejected'),
                stats?.rejected ?? 0,
                <CloseCircleOutlined />,
                tokens.status.error,
                t('summary.rejectedDesc'),
              )}
            </Col>
            <Col xs={24} md={12} xl={8} xxl={4}>
              {renderSummaryCard(
                styles,
                t('summary.deliveryFailed'),
                stats?.byStatus?.failed ?? 0,
                <WarningOutlined />,
                tokens.status.error,
                t('summary.deliveryFailedDesc'),
              )}
            </Col>
            <Col xs={24} md={12} xl={8} xxl={4}>
              {renderSummaryCard(
                styles,
                t('summary.dlq'),
                dlqCount,
                <SendOutlined />,
                tokens.status.info,
                t('summary.dlqDesc'),
              )}
            </Col>
          </Row>
        </Space>
      </div>

      {error ? (
        <Alert
          type="error"
          showIcon
          message={t('page.operationFailed')}
          description={error}
          style={{ marginBottom: 20, borderRadius: 18 }}
        />
      ) : null}

      <Tabs
        activeKey={activeTab}
        onChange={(key) => void setActiveTab(key as 'history' | 'dlq')}
        items={[
          {
            key: 'history',
            label: t('tabs.history', { count: stats?.total ?? total }),
            children: historyTabContent,
          },
          {
            key: 'dlq',
            label: t('tabs.dlq', { count: dlqCount }),
            children: dlqTabContent,
          },
        ]}
      />

      <Drawer
        title={t('detail.title')}
        width={520}
        open={Boolean(activeNotification)}
        onClose={closeNotification}
      >
        <Spin spinning={detailLoading}>
          {activeNotification ? (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Alert
                type={activeNotification.ackStatus === 'pending' ? 'warning' : 'info'}
                showIcon
                message={t('detail.currentStatus', { status: activeNotification.ackStatus })}
                description={t('detail.deliveryStatus', { status: activeNotification.deliveryStatus })}
                style={{ borderRadius: 14 }}
              />
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label={t('detail.labels.title')}>{activeNotification.title}</Descriptions.Item>
                <Descriptions.Item label={t('detail.labels.message')}>{activeNotification.content || '-'}</Descriptions.Item>
                <Descriptions.Item label={t('detail.labels.eventType')}>{activeNotification.eventType}</Descriptions.Item>
                <Descriptions.Item label={t('detail.labels.priority')}>{activeNotification.priority}</Descriptions.Item>
                <Descriptions.Item label={t('detail.labels.channel')}>{activeNotification.channel}</Descriptions.Item>
                <Descriptions.Item label={t('detail.labels.taskId')}>{activeNotification.taskId || '-'}</Descriptions.Item>
                <Descriptions.Item label={t('detail.labels.workerId')}>{activeNotification.workerId || '-'}</Descriptions.Item>
                <Descriptions.Item label={t('detail.labels.time')}>{formatTime(activeNotification.timestamp)}</Descriptions.Item>
                <Descriptions.Item label={t('detail.labels.ackedBy')}>{activeNotification.ackedBy || '-'}</Descriptions.Item>
                <Descriptions.Item label={t('detail.labels.ackedAt')}>{formatTime(activeNotification.ackedAt)}</Descriptions.Item>
                <Descriptions.Item label={t('detail.labels.comment')}>{activeNotification.ackComment || '-'}</Descriptions.Item>
                <Descriptions.Item label={t('detail.labels.retries')}>{activeNotification.retries}</Descriptions.Item>
                <Descriptions.Item label={t('detail.labels.duration')}>{`${activeNotification.durationMs} ms`}</Descriptions.Item>
                <Descriptions.Item label={t('detail.labels.hasData')}>
                  {activeNotification.hasData ? t('detail.hasDataYes') : t('detail.hasDataNo')}
                </Descriptions.Item>
                <Descriptions.Item label={t('detail.labels.error')}>{activeNotification.error || '-'}</Descriptions.Item>
              </Descriptions>
            </Space>
          ) : null}
        </Spin>
      </Drawer>

      <Drawer
        title={t('detail.dlqTitle')}
        width={520}
        open={Boolean(activeDeadLetter)}
        onClose={closeDeadLetter}
      >
        <Spin spinning={detailLoading}>
          {activeDeadLetter ? (
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label={t('detail.labels.title')}>{activeDeadLetter.title}</Descriptions.Item>
              <Descriptions.Item label={t('detail.labels.reason')}>{activeDeadLetter.reason || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('detail.labels.source')}>{activeDeadLetter.source || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('detail.labels.failedAt')}>{formatTime(activeDeadLetter.failedAt)}</Descriptions.Item>
              <Descriptions.Item label={t('detail.labels.eventType')}>{activeDeadLetter.event?.type || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('detail.labels.priority')}>{activeDeadLetter.event?.priority || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('detail.labels.taskId')}>{activeDeadLetter.event?.taskId || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('detail.labels.workerId')}>{activeDeadLetter.event?.workerId || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('detail.labels.eventTime')}>{formatTime(activeDeadLetter.event?.timestamp)}</Descriptions.Item>
              <Descriptions.Item label={t('detail.labels.message')}>{activeDeadLetter.event?.message || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('detail.labels.hasData')}>
                {activeDeadLetter.event?.hasData ? t('detail.hasDataYes') : t('detail.hasDataNo')}
              </Descriptions.Item>
            </Descriptions>
          ) : null}
        </Spin>
      </Drawer>
    </div>
  );
}

function createNotificationStyles(tokens: ThemeTokens, isDark: boolean): NotificationPageStyles {
  const panelShadow = isDark ? '0 16px 42px rgba(0, 0, 0, 0.28)' : '0 14px 36px rgba(15, 23, 42, 0.08)';
  const subtleShadow = isDark ? '0 10px 28px rgba(0, 0, 0, 0.22)' : '0 10px 24px rgba(15, 23, 42, 0.06)';
  const heroBackground = isDark
    ? `linear-gradient(135deg, ${tokens.bg.elevated} 0%, ${tokens.bg.secondary} 100%)`
    : `linear-gradient(135deg, ${tokens.bg.elevated} 0%, ${tokens.bg.secondary} 100%)`;

  return {
    page: {
      minHeight: '100%',
      padding: '28px 24px 40px',
      background: tokens.bg.primary,
    },
    hero: {
      position: 'relative',
      overflow: 'hidden',
      marginBottom: 22,
      padding: 24,
      borderRadius: 16,
      border: `1px solid ${tokens.border.default}`,
      background: heroBackground,
      boxShadow: panelShadow,
    },
    heroTexture: {
      position: 'absolute',
      inset: 0,
      background: isDark
        ? `linear-gradient(120deg, ${tokens.brand.primary}16, transparent 34%)`
        : `linear-gradient(120deg, ${tokens.brand.primary}0f, transparent 34%)`,
      pointerEvents: 'none',
    },
    heroTitle: {
      margin: 0,
      color: tokens.text.primary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    },
    heroText: {
      maxWidth: 760,
      margin: 0,
      color: tokens.text.secondary,
      fontSize: 15,
      lineHeight: 1.8,
    },
    summaryCard: {
      height: '100%',
      borderRadius: 14,
      borderColor: tokens.border.default,
      background: tokens.bg.elevated,
      boxShadow: subtleShadow,
    },
    summaryIcon: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 38,
      height: 38,
      borderRadius: 10,
      fontSize: 18,
    },
    summaryTitle: {
      color: tokens.text.secondary,
      fontWeight: 600,
    },
    panelCard: {
      borderRadius: 16,
      borderColor: tokens.border.default,
      background: tokens.bg.elevated,
      boxShadow: subtleShadow,
    },
    batchCard: {
      borderRadius: 14,
      borderColor: tokens.border.focus,
      background: isDark ? `${tokens.brand.primary}12` : `${tokens.brand.primary}0d`,
    },
    recordCard: {
      height: '100%',
      borderRadius: 16,
      borderColor: tokens.border.default,
      background: tokens.bg.elevated,
      boxShadow: subtleShadow,
    },
    recordTitle: {
      color: tokens.text.primary,
      fontSize: 16,
      fontWeight: 700,
    },
    recordMessage: {
      margin: 0,
      color: tokens.text.secondary,
      fontSize: 14,
      lineHeight: 1.75,
    },
    metaBlock: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      padding: '10px 12px',
      borderRadius: 12,
      background: tokens.bg.tertiary,
    },
    checkboxPlaceholder: {
      display: 'inline-block',
      width: 16,
    },
    inlineDivider: {
      color: tokens.border.hover,
    },
    paginationCard: {
      borderRadius: 14,
      borderColor: tokens.border.default,
      background: tokens.bg.elevated,
      boxShadow: subtleShadow,
    },
  };
}

export default NotificationPage;

import type { CSSProperties } from 'react';
import { memo, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Col,
  Collapse,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  TimePicker,
  Typography,
} from 'antd';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useIsDark } from '@/theme';
import { getSchedulerTheme } from '../../theme';
import type {
  CreateScheduledTaskRequest,
  ScheduledTask,
  ScheduledTaskScheduleType,
  ScheduledTaskPriority,
  ScheduledTaskRetryStrategy,
} from '@/types/api/scheduled-task';
import {
  CRON_FIELD_GUIDE,
  CRON_PRESETS,
  isValidCronExpression,
  nanosecondsToSeconds,
  secondsToNanoseconds,
} from '@/types/api/scheduled-task';
import type {
  SchedulerNotificationChannelOption,
  SchedulerResourceOption,
} from '../../service';

const { Text, Title } = Typography;
const { TextArea } = Input;

type ScheduleMode = 'daily' | 'weekly' | 'interval' | 'advanced';
type IntervalUnit = 'm' | 'h' | 'd';

const PRIORITY_OPTIONS: Array<{ label: string; value: ScheduledTaskPriority }> = [
  { label: 'P0', value: 'p0' },
  { label: 'P1', value: 'p1' },
  { label: 'P2', value: 'p2' },
  { label: 'P3', value: 'p3' },
];

interface TaskFormValues {
  name: string;
  description?: string;
  enabled: boolean;
  schedule_mode: ScheduleMode;
  schedule_time: Dayjs | null;
  schedule_days: number[];
  interval_value: number | null;
  interval_unit: IntervalUnit;
  schedule_expression: string;
  benchmark_ids: string[];
  agent_ids: string[];
  priority: ScheduledTaskPriority;
  timeout_seconds: number;
  max_steps: number;
  temperature: number;
  max_tokens: number;
  retry_enabled: boolean;
  retry_max_attempts: number;
  retry_backoff_strategy: ScheduledTaskRetryStrategy;
  retry_initial_backoff_seconds: number;
  retry_max_backoff_seconds: number;
  notification_enabled: boolean;
  notification_channels: string[];
  notification_events: string[];
}

const DEFAULT_SCHEDULE_TIME = dayjs('09:00', 'HH:mm');
const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5];
const SUPPORTED_EDITABLE_SCHEDULE_TYPES = new Set<ScheduledTaskScheduleType>(['cron', 'interval']);

interface CreateTaskModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (data: CreateScheduledTaskRequest) => Promise<void>;
  editingTask?: ScheduledTask | null;
  loadingResources?: boolean;
  agents: SchedulerResourceOption[];
  benchmarks: SchedulerResourceOption[];
  notificationChannels: SchedulerNotificationChannelOption[];
}

function buildInitialValues(editingTask?: ScheduledTask | null): TaskFormValues {
  const scheduleFields = deriveScheduleFields(editingTask);

  if (!editingTask) {
    return {
      name: '',
      description: '',
      enabled: true,
      ...scheduleFields,
      schedule_expression: CRON_PRESETS[3].value,
      benchmark_ids: [],
      agent_ids: [],
      priority: 'p2',
      timeout_seconds: 300,
      max_steps: 10,
      temperature: 0.2,
      max_tokens: 4096,
      retry_enabled: false,
      retry_max_attempts: 3,
      retry_backoff_strategy: 'exponential',
      retry_initial_backoff_seconds: 60,
      retry_max_backoff_seconds: 600,
      notification_enabled: false,
      notification_channels: [],
      notification_events: ['failed'],
    };
  }

  return {
    name: editingTask.name,
    description: editingTask.description,
    enabled: editingTask.enabled,
    ...scheduleFields,
    schedule_expression: editingTask.schedule.expression,
    benchmark_ids: editingTask.execution_config.benchmark_ids,
    agent_ids: editingTask.execution_config.agent_ids,
    priority: editingTask.execution_config.task_config.priority || 'p2',
    timeout_seconds: nanosecondsToSeconds(editingTask.execution_config.task_config.timeout) || 300,
    max_steps: editingTask.execution_config.task_config.max_steps || 10,
    temperature: editingTask.execution_config.agent_config.temperature ?? 0.2,
    max_tokens: editingTask.execution_config.agent_config.max_tokens || 4096,
    retry_enabled: editingTask.retry.enabled,
    retry_max_attempts: editingTask.retry.max_attempts || 3,
    retry_backoff_strategy: editingTask.retry.backoff_strategy || 'exponential',
    retry_initial_backoff_seconds: nanosecondsToSeconds(editingTask.retry.initial_backoff) || 60,
    retry_max_backoff_seconds: nanosecondsToSeconds(editingTask.retry.max_backoff) || 600,
    notification_enabled: editingTask.notification.enabled,
    notification_channels: editingTask.notification.channels,
    notification_events:
      editingTask.notification.on_events.length > 0
        ? editingTask.notification.on_events
        : ['failed'],
  };
}

function toPayload(values: TaskFormValues, editingTask?: ScheduledTask | null): CreateScheduledTaskRequest {
  const schedule = buildScheduleConfig(values, editingTask);

  return {
    name: values.name.trim(),
    description: values.description?.trim() || '',
    enabled: values.enabled,
    schedule,
    execution_config: {
      benchmark_ids: values.benchmark_ids,
      agent_ids: values.agent_ids,
      task_config: {
        priority: values.priority,
        timeout: secondsToNanoseconds(values.timeout_seconds),
        max_steps: values.max_steps,
      },
      agent_config: {
        temperature: values.temperature,
        max_tokens: values.max_tokens,
      },
    },
    retry: {
      enabled: values.retry_enabled,
      max_attempts: values.retry_max_attempts,
      backoff_strategy: values.retry_backoff_strategy,
      initial_backoff: secondsToNanoseconds(values.retry_initial_backoff_seconds),
      max_backoff: secondsToNanoseconds(values.retry_max_backoff_seconds),
    },
    notification: {
      enabled: values.notification_enabled,
      channels: values.notification_channels,
      on_events: values.notification_events,
    },
  };
}

function deriveScheduleFields(editingTask?: ScheduledTask | null): Pick<
  TaskFormValues,
  'schedule_mode' | 'schedule_time' | 'schedule_days' | 'interval_value' | 'interval_unit'
> {
  if (!editingTask) {
    return {
      schedule_mode: 'weekly',
      schedule_time: DEFAULT_SCHEDULE_TIME,
      schedule_days: DEFAULT_WEEKDAYS,
      interval_value: 5,
      interval_unit: 'm',
    };
  }

  if (editingTask.schedule.type === 'interval') {
    const interval = parseIntervalExpression(editingTask.schedule.expression);
    return {
      schedule_mode: 'interval',
      schedule_time: DEFAULT_SCHEDULE_TIME,
      schedule_days: DEFAULT_WEEKDAYS,
      interval_value: interval.value,
      interval_unit: interval.unit,
    };
  }

  const cron = parseUserCron(editingTask.schedule.expression);
  if (!cron) {
    return {
      schedule_mode: 'advanced',
      schedule_time: DEFAULT_SCHEDULE_TIME,
      schedule_days: DEFAULT_WEEKDAYS,
      interval_value: 5,
      interval_unit: 'm',
    };
  }

  return {
    schedule_mode: cron.days.length === 7 ? 'daily' : 'weekly',
    schedule_time: dayjs(`${padNumber(cron.hour)}:${padNumber(cron.minute)}`, 'HH:mm'),
    schedule_days: cron.days,
    interval_value: 5,
    interval_unit: 'm',
  };
}

function buildScheduleConfig(
  values: TaskFormValues,
  editingTask?: ScheduledTask | null
): CreateScheduledTaskRequest['schedule'] {
  const lockedType = editingTask && !SUPPORTED_EDITABLE_SCHEDULE_TYPES.has(editingTask.schedule.type);
  if (lockedType) {
    return {
      type: editingTask.schedule.type,
      expression: values.schedule_expression.trim(),
    };
  }

  if (values.schedule_mode === 'interval') {
    return {
      type: 'interval',
      expression: `${Math.max(1, values.interval_value ?? 1)}${values.interval_unit}`,
    };
  }

  if (values.schedule_mode === 'advanced') {
    return {
      type: 'cron',
      expression: values.schedule_expression.trim(),
    };
  }

  const time = values.schedule_time ?? DEFAULT_SCHEDULE_TIME;
  const days = values.schedule_mode === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : values.schedule_days;

  return {
    type: 'cron',
    expression: `0 ${time.minute()} ${time.hour()} * * ${formatCronDays(days)}`,
  };
}

function parseIntervalExpression(expression: string): { value: number; unit: IntervalUnit } {
  const match = expression.trim().match(/^(\d+)\s*([mhd])$/);
  if (!match) {
    return { value: 5, unit: 'm' };
  }

  return {
    value: Math.max(1, Number(match[1])),
    unit: match[2] as IntervalUnit,
  };
}

function parseUserCron(expression: string): { hour: number; minute: number; days: number[] } | null {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 6) {
    return null;
  }

  const [second, minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  if (second !== '0' || dayOfMonth !== '*' || month !== '*') {
    return null;
  }

  const parsedHour = Number(hour);
  const parsedMinute = Number(minute);
  if (
    !Number.isInteger(parsedHour) ||
    !Number.isInteger(parsedMinute) ||
    parsedHour < 0 ||
    parsedHour > 23 ||
    parsedMinute < 0 ||
    parsedMinute > 59
  ) {
    return null;
  }

  const days = parseCronDays(dayOfWeek);
  if (days.length === 0) {
    return null;
  }

  return {
    hour: parsedHour,
    minute: parsedMinute,
    days,
  };
}

function parseCronDays(value: string): number[] {
  if (value === '*') {
    return [0, 1, 2, 3, 4, 5, 6];
  }

  if (value.includes('-')) {
    const [start, end] = value.split('-').map(Number);
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end > 6 || start > end) {
      return [];
    }
    return Array.from({ length: end - start + 1 }, (_item, index) => start + index);
  }

  const days = value.split(',').map(Number);
  const uniqueDays = Array.from(new Set(days)).sort((a, b) => a - b);
  return uniqueDays.every((day) => Number.isInteger(day) && day >= 0 && day <= 6) ? uniqueDays : [];
}

function formatCronDays(days: number[]): string {
  const sorted = Array.from(new Set(days)).sort((a, b) => a - b);
  if (sorted.length === 7) {
    return '*';
  }
  if (sorted.join(',') === DEFAULT_WEEKDAYS.join(',')) {
    return '1-5';
  }
  return sorted.join(',');
}

function padNumber(value: number): string {
  return String(value).padStart(2, '0');
}

export const CreateTaskModal = memo(function CreateTaskModal({
  open,
  onCancel,
  onSubmit,
  editingTask,
  loadingResources = false,
  agents,
  benchmarks,
  notificationChannels,
}: CreateTaskModalProps) {
  const { t } = useTranslation('scheduler');
  const isDark = useIsDark();
  const theme = getSchedulerTheme(isDark);
  const [form] = Form.useForm<TaskFormValues>();
  const [submitting, setSubmitting] = useState(false);

  const retryEnabled = Form.useWatch('retry_enabled', form) ?? false;
  const notificationEnabled = Form.useWatch('notification_enabled', form) ?? false;
  const selectedAgents = Form.useWatch('agent_ids', form) ?? [];
  const selectedBenchmarks = Form.useWatch('benchmark_ids', form) ?? [];
  const selectedNotificationChannels = Form.useWatch('notification_channels', form) ?? [];
  const scheduleMode = Form.useWatch('schedule_mode', form) ?? 'weekly';
  const lockedScheduleType = Boolean(
    editingTask && !SUPPORTED_EDITABLE_SCHEDULE_TYPES.has(editingTask.schedule.type)
  );
  const hasResourceCatalog = agents.length > 0 && benchmarks.length > 0;

  const retryStrategyOptions = useMemo<Array<{ label: string; value: ScheduledTaskRetryStrategy }>>(
    () => [
      { label: t('modal.retryStrategies.exponential'), value: 'exponential' },
      { label: t('modal.retryStrategies.linear'), value: 'linear' },
      { label: t('modal.retryStrategies.fixed'), value: 'fixed' },
    ],
    [t]
  );

  const notificationEventOptions = useMemo(
    () => [
      { label: t('modal.events.started'), value: 'started' },
      { label: t('modal.events.completed'), value: 'completed' },
      { label: t('modal.events.failed'), value: 'failed' },
      { label: t('modal.events.cancelled'), value: 'cancelled' },
    ],
    [t]
  );

  const scheduleModeOptions = useMemo(
    () => [
      { label: t('modal.scheduleModes.weekly'), value: 'weekly' },
      { label: t('modal.scheduleModes.daily'), value: 'daily' },
      { label: t('modal.scheduleModes.interval'), value: 'interval' },
      { label: t('modal.scheduleModes.advanced'), value: 'advanced' },
    ],
    [t]
  );

  const dayOptions = useMemo(
    () =>
      (t('days.full', { returnObjects: true }) as string[]).map((label, value) => ({
        label,
        value,
      })),
    [t]
  );

  const intervalUnitOptions = useMemo(
    () => [
      { label: t('modal.intervalUnits.minutes'), value: 'm' },
      { label: t('modal.intervalUnits.hours'), value: 'h' },
      { label: t('modal.intervalUnits.days'), value: 'd' },
    ],
    [t]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    form.setFieldsValue(buildInitialValues(editingTask));
  }, [editingTask, form, open]);

  async function handleFinish() {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      await onSubmit(toPayload(values, editingTask));
      form.resetFields();
      onCancel();
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    form.resetFields();
    onCancel();
  }

  const agentOptions = mergeResourceOptions(agents, selectedAgents).map((item) => ({
    label: item.meta ? `${item.name} / ${item.meta}` : item.name,
    value: item.id,
  }));

  const benchmarkOptions = mergeResourceOptions(benchmarks, selectedBenchmarks).map((item) => ({
    label: item.meta ? `${item.name} / ${item.meta}` : item.name,
    value: item.id,
  }));

  const channelOptions = mergeChannelOptions(notificationChannels, selectedNotificationChannels).map((item) => ({
    label: item.label,
    value: item.type,
    disabled: !item.healthy,
  }));

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      width={980}
      title={null}
      footer={null}
      destroyOnHidden
      styles={{
        content: {
          background: isDark ? 'linear-gradient(180deg, #0a0e27 0%, #131a31 100%)' : '#ffffff',
          border: isDark ? `1px solid ${theme.cardBorder}` : undefined,
          borderRadius: 24,
          boxShadow: isDark
            ? '0 26px 80px rgba(0, 0, 0, 0.42)'
            : '0 24px 60px rgba(15, 23, 42, 0.12)',
          overflow: 'hidden',
        },
      }}
    >
      <div style={{ padding: isDark ? '12px 10px 8px' : 0 }}>
        <div style={headerStyle(isDark, theme)}>
          <div>
            <Space align="center" size={12} wrap>
              <Title level={3} style={{ margin: 0, color: theme.textPrimary }}>
                {editingTask ? t('modal.editTitle') : t('modal.createTitle')}
              </Title>
              <Tag color="blue">{t('modal.cronOnly')}</Tag>
              {editingTask ? (
                <Tag color={editingTask.enabled ? 'success' : 'default'}>
                  {editingTask.enabled ? t('status.enabled') : t('status.paused')}
                </Tag>
              ) : null}
            </Space>
            <Text style={{ color: theme.textSecondary }}>{t('modal.subtitle')}</Text>
          </div>
          <div style={{ maxWidth: 360 }}>
            <Text style={{ color: theme.textSecondary }}>
              {t('modal.userScheduleHint')}
            </Text>
          </div>
        </div>

        {lockedScheduleType ? (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message={`${t('modal.fields.scheduleMode')}: ${editingTask?.schedule.type}`}
            description={t('modal.lockedScheduleMessage')}
          />
        ) : null}

        {loadingResources ? (
          <Alert type="info" showIcon style={{ marginBottom: 16 }} message={t('modal.resourcePending')} />
        ) : null}

        {!loadingResources && !hasResourceCatalog ? (
          <Alert type="warning" showIcon style={{ marginBottom: 16 }} message={t('modal.resourceUnavailable')} />
        ) : null}

        <Form<TaskFormValues> form={form} layout="vertical">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <div style={sectionStyle(isDark, theme)}>
                <Title level={5} style={sectionTitleStyle(theme)}>
                  {t('modal.sections.basic')}
                </Title>
                <Form.Item
                  label={t('modal.fields.name')}
                  name="name"
                  rules={[
                    { required: true, message: t('modal.validation.nameRequired') },
                    { max: 255, message: t('modal.validation.nameTooLong') },
                  ]}
                >
                  <Input placeholder={t('modal.fields.namePlaceholder')} />
                </Form.Item>
                <Form.Item
                  label={t('modal.fields.description')}
                  name="description"
                  rules={[{ max: 2000, message: t('modal.validation.descriptionTooLong') }]}
                >
                  <TextArea
                    rows={4}
                    placeholder={t('modal.fields.descriptionPlaceholder')}
                  />
                </Form.Item>

                {!editingTask ? (
                  <Form.Item label={t('modal.fields.createEnabled')} name="enabled" valuePropName="checked">
                    <Switch checkedChildren={t('status.enabled')} unCheckedChildren={t('status.paused')} />
                  </Form.Item>
                ) : (
                  <Alert
                    type="info"
                    showIcon
                    message={`${t('modal.fields.currentEnabled')}: ${editingTask.enabled ? t('status.enabled') : t('status.paused')}`}
                    description={t('modal.fields.editEnabledHint')}
                  />
                )}
              </div>

              <div style={sectionStyle(isDark, theme)}>
                <Space align="center" style={{ justifyContent: 'space-between', width: '100%', marginBottom: 12 }}>
                  <Title level={5} style={sectionTitleStyle(theme)}>
                    {t('modal.sections.schedule')}
                  </Title>
                  <Tag color="blue">{t('modal.scheduleBackendTag')}</Tag>
                </Space>
                {lockedScheduleType ? (
                  <>
                    <Form.Item label={t('modal.fields.scheduleMode')}>
                      <Select
                        disabled
                        value={editingTask?.schedule.type}
                        options={editingTask ? [{ label: editingTask.schedule.type, value: editingTask.schedule.type }] : []}
                      />
                    </Form.Item>
                    <Form.Item
                      label={t('modal.fields.cronExpression')}
                      name="schedule_expression"
                      rules={[{ required: true, message: t('modal.validation.cronRequired') }]}
                    >
                      <Input disabled placeholder={t('modal.fields.cronPlaceholder')} />
                    </Form.Item>
                  </>
                ) : (
                  <>
                    <Form.Item label={t('modal.fields.scheduleMode')} name="schedule_mode">
                      <Radio.Group
                        optionType="button"
                        buttonStyle="solid"
                        options={scheduleModeOptions}
                        style={modeGroupStyle}
                      />
                    </Form.Item>

                    {scheduleMode === 'daily' || scheduleMode === 'weekly' ? (
                      <Row gutter={12}>
                        <Col xs={24} sm={12}>
                          <Form.Item
                            label={t('modal.fields.runTime')}
                            name="schedule_time"
                            rules={[{ required: true, message: t('modal.validation.timeRequired') }]}
                          >
                            <TimePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        {scheduleMode === 'weekly' ? (
                          <Col xs={24}>
                            <Form.Item
                              label={t('modal.fields.runDays')}
                              name="schedule_days"
                              rules={[{ required: true, type: 'array', min: 1, message: t('modal.validation.dayRequired') }]}
                            >
                              <Checkbox.Group options={dayOptions} style={dayGroupStyle} />
                            </Form.Item>
                          </Col>
                        ) : null}
                      </Row>
                    ) : null}

                    {scheduleMode === 'interval' ? (
                      <Row gutter={12}>
                        <Col xs={12}>
                          <Form.Item
                            label={t('modal.fields.intervalValue')}
                            name="interval_value"
                            rules={[{ required: true, message: t('modal.validation.intervalRequired') }]}
                          >
                            <InputNumber min={1} max={999} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col xs={12}>
                          <Form.Item label={t('modal.fields.intervalUnit')} name="interval_unit">
                            <Select options={intervalUnitOptions} />
                          </Form.Item>
                        </Col>
                      </Row>
                    ) : null}

                    {scheduleMode === 'advanced' ? (
                      <>
                        <Alert
                          type="info"
                          showIcon
                          style={{ marginBottom: 12 }}
                          message={t('modal.advancedCronMessage')}
                          description={`${t('modal.fields.cronHint')} ${CRON_FIELD_GUIDE}`}
                        />
                        <Form.Item
                          label={t('modal.fields.cronExpression')}
                          name="schedule_expression"
                          rules={[
                            { required: true, message: t('modal.validation.cronRequired') },
                            {
                              validator: async (_rule, value?: string) => {
                                if (!value || isValidCronExpression(value)) {
                                  return;
                                }

                                throw new Error(t('modal.validation.cronInvalid'));
                              },
                            },
                          ]}
                        >
                          <Input placeholder={t('modal.fields.cronPlaceholder')} />
                        </Form.Item>
                        <div style={{ marginBottom: 8 }}>
                          <Text style={{ color: theme.textSecondary }}>{t('modal.fields.preset')}</Text>
                          <div style={{ marginTop: 10 }}>
                            <Space wrap>
                              {CRON_PRESETS.map((preset) => (
                                <Button
                                  key={preset.value}
                                  size="small"
                                  onClick={() => form.setFieldValue('schedule_expression', preset.value)}
                                >
                                  {preset.label}
                                </Button>
                              ))}
                            </Space>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </>
                )}
              </div>
            </Col>

            <Col xs={24} lg={12}>
              <div style={sectionStyle(isDark, theme)}>
                <Title level={5} style={sectionTitleStyle(theme)}>
                  {t('modal.sections.resources')}
                </Title>
                <Form.Item
                  label={t('modal.fields.benchmark')}
                  name="benchmark_ids"
                  rules={[{ required: true, type: 'array', min: 1, message: t('modal.validation.benchmarkRequired') }]}
                >
                  <Select
                    mode="multiple"
                    allowClear
                    showSearch
                    loading={loadingResources}
                    optionFilterProp="label"
                    placeholder={t('modal.fields.benchmarkPlaceholder')}
                    options={benchmarkOptions}
                  />
                </Form.Item>
                <Form.Item
                  label={t('modal.fields.agent')}
                  name="agent_ids"
                  rules={[{ required: true, type: 'array', min: 1, message: t('modal.validation.agentRequired') }]}
                >
                  <Select
                    mode="multiple"
                    allowClear
                    showSearch
                    loading={loadingResources}
                    optionFilterProp="label"
                    placeholder={t('modal.fields.agentPlaceholder')}
                    options={agentOptions}
                  />
                </Form.Item>
                <Text style={{ color: theme.textSecondary }}>
                  {`${t('modal.resourceSummaryPrefix')} ${selectedBenchmarks.length} Benchmark / ${selectedAgents.length} Agent`}
                </Text>
              </div>

              <div style={sectionStyle(isDark, theme)}>
                <Title level={5} style={sectionTitleStyle(theme)}>
                  {t('modal.sections.execution')}
                </Title>
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item label={t('modal.fields.priority')} name="priority">
                      <Select options={PRIORITY_OPTIONS} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label={t('modal.fields.timeoutSeconds')} name="timeout_seconds">
                      <InputNumber min={1} max={3600} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label={t('modal.fields.maxSteps')} name="max_steps">
                      <InputNumber min={1} max={10000} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label={t('modal.fields.temperature')} name="temperature">
                      <InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label={t('modal.fields.maxTokens')} name="max_tokens">
                      <InputNumber min={1} max={200000} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>

          <Divider style={{ borderColor: isDark ? theme.cardBorder : undefined }} />

          <Collapse
            ghost
            items={[
              {
                key: 'retry',
                label: t('modal.sections.retry'),
                children: (
                  <Row gutter={16}>
                    <Col xs={24} md={8}>
                      <Form.Item label={t('modal.fields.retryEnabled')} name="retry_enabled" valuePropName="checked">
                        <Switch checkedChildren={t('status.enabled')} unCheckedChildren={t('status.closed')} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item label={t('modal.fields.retryAttempts')} name="retry_max_attempts">
                        <InputNumber min={1} max={100} disabled={!retryEnabled} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item label={t('modal.fields.retryStrategy')} name="retry_backoff_strategy">
                        <Select disabled={!retryEnabled} options={retryStrategyOptions} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label={t('modal.fields.retryInitial')} name="retry_initial_backoff_seconds">
                        <InputNumber min={1} max={3600} disabled={!retryEnabled} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label={t('modal.fields.retryMax')} name="retry_max_backoff_seconds">
                        <InputNumber min={1} max={86400} disabled={!retryEnabled} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                ),
              },
              {
                key: 'notification',
                label: t('modal.sections.notification'),
                children: (
                  <>
                    {notificationChannels.length === 0 && selectedNotificationChannels.length === 0 ? (
                      <Alert type="info" showIcon style={{ marginBottom: 16 }} message={t('modal.notificationUnavailable')} />
                    ) : null}
                    <Row gutter={16}>
                      <Col xs={24} md={8}>
                        <Form.Item label={t('modal.fields.notificationEnabled')} name="notification_enabled" valuePropName="checked">
                          <Switch
                            checkedChildren={t('status.enabled')}
                            unCheckedChildren={t('status.closed')}
                            disabled={notificationChannels.length === 0 && selectedNotificationChannels.length === 0}
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={16}>
                        <Form.Item
                          label={t('modal.fields.notificationChannels')}
                          name="notification_channels"
                          rules={[
                            {
                              validator: async (_rule, value?: string[]) => {
                                if (!notificationEnabled || (value && value.length > 0)) {
                                  return;
                                }
                                throw new Error(t('modal.validation.channelRequired'));
                              },
                            },
                          ]}
                        >
                          <Select
                            mode="multiple"
                            allowClear
                            disabled={!notificationEnabled}
                            placeholder={t('modal.fields.channelsPlaceholder')}
                            options={channelOptions}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item
                          label={t('modal.fields.notificationEvents')}
                          name="notification_events"
                          rules={[
                            {
                              validator: async (_rule, value?: string[]) => {
                                if (!notificationEnabled || (value && value.length > 0)) {
                                  return;
                                }
                                throw new Error(t('modal.validation.eventRequired'));
                              },
                            },
                          ]}
                        >
                          <Select
                            mode="multiple"
                            allowClear
                            disabled={!notificationEnabled}
                            placeholder={t('modal.fields.eventsPlaceholder')}
                            options={notificationEventOptions}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </>
                ),
              },
            ]}
          />
        </Form>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <Button onClick={handleCancel}>{t('actions.cancel')}</Button>
          <Button type="primary" loading={submitting} onClick={handleFinish}>
            {editingTask ? t('actions.save') : t('actions.submit')}
          </Button>
        </div>
      </div>
    </Modal>
  );
});

export default CreateTaskModal;

function mergeResourceOptions(options: SchedulerResourceOption[], selectedValues: string[]) {
  const known = new Map(options.map((item) => [item.id, item]));

  return [
    ...options,
    ...selectedValues
      .filter((value) => !known.has(value))
      .map((value) => ({
        id: value,
        name: value,
        description: i18next.t('scheduler:modal.unknownResource'),
        meta: i18next.t('scheduler:modal.preservedSuffix'),
      })),
  ];
}

function mergeChannelOptions(
  options: SchedulerNotificationChannelOption[],
  selectedValues: string[]
): Array<{ type: string; label: string; healthy: boolean }> {
  const known = new Map(options.map((item) => [item.type, item]));
  const merged = [
    ...options.map((item) => ({
      type: item.type,
      healthy: item.healthy,
      label: item.healthy ? item.type : `${item.type} ${i18next.t('scheduler:modal.unhealthySuffix')}`,
    })),
    ...selectedValues
      .filter((value) => !known.has(value))
      .map((value) => ({
        type: value,
        healthy: true,
        label: `${value} ${i18next.t('scheduler:modal.preservedSuffix')}`,
      })),
  ];

  return merged;
}

const modeGroupStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
};

const dayGroupStyle: CSSProperties = {
  display: 'grid',
  gap: 8,
  gridTemplateColumns: 'repeat(auto-fit, minmax(76px, 1fr))',
  width: '100%',
};

function headerStyle(isDark: boolean, theme: ReturnType<typeof getSchedulerTheme>): CSSProperties {
  return {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    padding: isDark ? '4px 4px 20px' : '0 0 20px',
    marginBottom: 16,
    borderBottom: `1px solid ${isDark ? theme.cardBorder : 'rgba(148, 163, 184, 0.22)'}`,
  };
}

function sectionStyle(isDark: boolean, theme: ReturnType<typeof getSchedulerTheme>): CSSProperties {
  return {
    padding: isDark ? '18px 18px 10px' : '16px 16px 8px',
    borderRadius: 18,
    background: isDark ? 'rgba(15, 23, 42, 0.55)' : '#f8fafc',
    border: `1px solid ${isDark ? theme.cardBorder : 'rgba(148, 163, 184, 0.24)'}`,
    boxShadow: isDark ? '0 14px 32px rgba(2, 6, 23, 0.28)' : '0 10px 24px rgba(15, 23, 42, 0.06)',
    marginBottom: 16,
  };
}

function sectionTitleStyle(theme: ReturnType<typeof getSchedulerTheme>): CSSProperties {
  return {
    marginTop: 0,
    marginBottom: 12,
    color: theme.textPrimary,
  };
}

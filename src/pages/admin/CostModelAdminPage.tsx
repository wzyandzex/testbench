/**
 * Admin 模型单价管理页
 *
 * 来源: /api/v1/cost/models
 * 用途: 维护 LLM 模型的输入/输出 token 价格（每 1k tokens），影响成本统计与告警
 *
 * 支持：
 * - 列出所有定价（含历史 / 过期）
 * - 仅显示生效中
 * - 新增定价（provider + model + 输入/输出价 + 生效时间 + 过期时间）
 * - 编辑（仅允许改价格、币种、过期时间、是否激活；provider/model_name 不可改）
 * - 删除
 *
 * 价格单位约定（与后端一致）: per 1k tokens
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { Trans, useTranslation } from 'react-i18next';
import {
  costModelService,
  type CreateModelCostRequest,
  type ModelCost,
  type UpdateModelCostRequest,
} from './costModelService';

const { Title, Paragraph, Text } = Typography;

const PROVIDER_OPTIONS = [
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'google', label: 'Google' },
  { value: 'azure', label: 'Azure OpenAI' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'qwen', label: 'Qwen' },
  { value: 'other', label: 'Other' },
];

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'CNY', label: 'CNY (¥)' },
  { value: 'EUR', label: 'EUR (€)' },
];

function providerTag(provider: string) {
  const colors: Record<string, string> = {
    anthropic: 'purple',
    openai: 'green',
    google: 'blue',
    azure: 'cyan',
    deepseek: 'magenta',
    qwen: 'orange',
  };
  return <Tag color={colors[provider] || 'default'}>{provider}</Tag>;
}

function priceText(p: number, currency: string) {
  const symbol = currency === 'USD' ? '$' : currency === 'CNY' ? '¥' : currency === 'EUR' ? '€' : '';
  return (
    <span style={{ fontFamily: 'monospace' }}>
      {symbol}
      {p.toFixed(6)}
    </span>
  );
}

interface CreateFormValues {
  provider: string;
  model_name: string;
  input_price: number;
  output_price: number;
  currency: string;
  effective_date: Dayjs;
  expiry_date?: Dayjs;
}

interface EditFormValues {
  input_price?: number;
  output_price?: number;
  currency?: string;
  expiry_date?: Dayjs | null;
  is_active?: boolean;
}

export default function CostModelAdminPage() {
  const { t } = useTranslation('admin');
  const [list, setList] = useState<ModelCost[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeOnly, setActiveOnly] = useState(false);

  const [createForm] = Form.useForm<CreateFormValues>();
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [editForm] = Form.useForm<EditFormValues>();
  const [editing, setEditing] = useState<ModelCost | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await costModelService.list(activeOnly);
      setList(resp.models || []);
    } catch (err) {
      message.error(
        t('costModel.messages.loadFailed', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setLoading(false);
    }
  }, [activeOnly, t]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const openCreate = () => {
    createForm.resetFields();
    createForm.setFieldsValue({
      currency: 'USD',
      effective_date: dayjs(),
    });
    setCreateOpen(true);
  };

  const handleCreate = async (values: CreateFormValues) => {
    setCreateLoading(true);
    try {
      const payload: CreateModelCostRequest = {
        provider: values.provider,
        model_name: values.model_name.trim(),
        input_price: values.input_price,
        output_price: values.output_price,
        currency: values.currency,
        effective_date: values.effective_date.toISOString(),
        expiry_date: values.expiry_date ? values.expiry_date.toISOString() : null,
      };
      await costModelService.create(payload);
      message.success(t('costModel.messages.created'));
      setCreateOpen(false);
      await fetchData();
    } catch (err) {
      message.error(
        t('costModel.messages.createFailed', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const openEdit = (mc: ModelCost) => {
    setEditing(mc);
    editForm.resetFields();
    editForm.setFieldsValue({
      input_price: mc.input_price,
      output_price: mc.output_price,
      currency: mc.currency,
      expiry_date: mc.expiry_date ? dayjs(mc.expiry_date) : null,
      is_active: mc.is_active,
    });
    setEditOpen(true);
  };

  const handleEdit = async (values: EditFormValues) => {
    if (!editing) return;
    setEditLoading(true);
    try {
      const payload: UpdateModelCostRequest = {};
      if (values.input_price != null) payload.input_price = values.input_price;
      if (values.output_price != null) payload.output_price = values.output_price;
      if (values.currency) payload.currency = values.currency;
      if (values.expiry_date !== undefined)
        payload.expiry_date = values.expiry_date ? values.expiry_date.toISOString() : null;
      if (values.is_active !== undefined) payload.is_active = values.is_active;

      await costModelService.update(editing.id, payload);
      message.success(t('costModel.messages.updated'));
      setEditOpen(false);
      setEditing(null);
      await fetchData();
    } catch (err) {
      message.error(
        t('costModel.messages.updateFailed', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (mc: ModelCost) => {
    try {
      await costModelService.delete(mc.id);
      message.success(t('costModel.messages.deleted'));
      await fetchData();
    } catch (err) {
      message.error(
        t('costModel.messages.deleteFailed', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    }
  };

  const columns: ColumnsType<ModelCost> = useMemo(
    () => [
      {
        title: t('costModel.columns.provider'),
        dataIndex: 'provider',
        key: 'provider',
        width: 120,
        render: providerTag,
      },
      {
        title: t('costModel.columns.modelName'),
        dataIndex: 'model_name',
        key: 'model_name',
        ellipsis: true,
        render: (v: string) => <Text strong>{v}</Text>,
      },
      {
        title: t('costModel.columns.inputPrice'),
        dataIndex: 'input_price',
        key: 'input_price',
        width: 160,
        render: (v: number, r: ModelCost) => priceText(v, r.currency),
      },
      {
        title: t('costModel.columns.outputPrice'),
        dataIndex: 'output_price',
        key: 'output_price',
        width: 160,
        render: (v: number, r: ModelCost) => priceText(v, r.currency),
      },
      {
        title: t('costModel.columns.currency'),
        dataIndex: 'currency',
        key: 'currency',
        width: 80,
      },
      {
        title: t('costModel.columns.effectiveDate'),
        dataIndex: 'effective_date',
        key: 'effective_date',
        width: 170,
        render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
      },
      {
        title: t('costModel.columns.expiryDate'),
        dataIndex: 'expiry_date',
        key: 'expiry_date',
        width: 170,
        render: (v: string | null | undefined) =>
          v ? dayjs(v).format('YYYY-MM-DD HH:mm') : <Tag>{t('costModel.tags.permanent')}</Tag>,
      },
      {
        title: t('costModel.columns.status'),
        dataIndex: 'is_active',
        key: 'is_active',
        width: 90,
        render: (v: boolean) =>
          v ? (
            <Tag color="success">{t('costModel.tags.active')}</Tag>
          ) : (
            <Tag color="default">{t('costModel.tags.disabled')}</Tag>
          ),
      },
      {
        title: t('costModel.columns.actions'),
        key: 'actions',
        width: 160,
        fixed: 'right',
        render: (_: unknown, mc: ModelCost) => (
          <Space size="small">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(mc)}>
              {t('costModel.actions.edit')}
            </Button>
            <Popconfirm
              title={t('costModel.deleteConfirm.title')}
              description={t('costModel.deleteConfirm.description')}
              okButtonProps={{ danger: true }}
              onConfirm={() => void handleDelete(mc)}
            >
              <Button type="link" danger size="small" icon={<DeleteOutlined />}>
                {t('costModel.actions.delete')}
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [t]
  );

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <Title level={3} style={{ marginBottom: 8 }}>
        <Space>
          <DollarOutlined />
          {t('costModel.title')}
        </Space>
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 16 }}>
        <Trans i18nKey="costModel.description" ns="admin" components={{ 1: <Text code /> }} />
      </Paragraph>

      <Card style={{ marginBottom: 16 }} bordered={false}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t('costModel.actions.create')}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => void fetchData()}>
            {t('costModel.actions.refresh')}
          </Button>
          <Space style={{ marginLeft: 16 }}>
            <span>{t('costModel.actions.activeOnly')}</span>
            <Switch checked={activeOnly} onChange={setActiveOnly} />
          </Space>
        </Space>
      </Card>

      <Card bordered={false}>
        <Table<ModelCost>
          rowKey="id"
          dataSource={list}
          columns={columns}
          loading={loading}
          scroll={{ x: 1300 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => t('costModel.pagination.total', { total }),
          }}
        />
      </Card>

      <Modal
        title={t('costModel.createModal.title')}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => createForm.submit()}
        confirmLoading={createLoading}
        destroyOnClose
        width={600}
      >
        <Form<CreateFormValues> form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            label={t('costModel.createModal.providerLabel')}
            name="provider"
            rules={[{ required: true }]}
          >
            <Select
              options={PROVIDER_OPTIONS}
              placeholder={t('costModel.createModal.providerPlaceholder')}
              showSearch
            />
          </Form.Item>
          <Form.Item
            label={t('costModel.createModal.modelNameLabel')}
            name="model_name"
            rules={[{ required: true, message: t('costModel.createModal.modelNameRequired') }]}
            extra={t('costModel.createModal.modelNameExtra')}
          >
            <Input placeholder={t('costModel.createModal.modelNamePlaceholder')} />
          </Form.Item>
          <Form.Item
            label={t('costModel.createModal.currencyLabel')}
            name="currency"
            rules={[{ required: true }]}
          >
            <Select options={CURRENCY_OPTIONS} />
          </Form.Item>
          <Form.Item
            label={t('costModel.createModal.inputPriceLabel')}
            name="input_price"
            rules={[{ required: true, type: 'number', min: 0 }]}
          >
            <InputNumber style={{ width: '100%' }} step={0.001} min={0} precision={6} />
          </Form.Item>
          <Form.Item
            label={t('costModel.createModal.outputPriceLabel')}
            name="output_price"
            rules={[{ required: true, type: 'number', min: 0 }]}
          >
            <InputNumber style={{ width: '100%' }} step={0.001} min={0} precision={6} />
          </Form.Item>
          <Form.Item
            label={t('costModel.createModal.effectiveDateLabel')}
            name="effective_date"
            rules={[{ required: true }]}
            extra={t('costModel.createModal.effectiveDateExtra')}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label={t('costModel.createModal.expiryDateLabel')}
            name="expiry_date"
            extra={t('costModel.createModal.expiryDateExtra')}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          editing
            ? t('costModel.editModal.title', {
                provider: editing.provider,
                model: editing.model_name,
              })
            : t('costModel.editModal.titleFallback')
        }
        open={editOpen}
        onCancel={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        onOk={() => editForm.submit()}
        confirmLoading={editLoading}
        destroyOnClose
        width={600}
      >
        <Form<EditFormValues> form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item
            label={t('costModel.editModal.inputPriceLabel')}
            name="input_price"
            rules={[{ type: 'number', min: 0 }]}
          >
            <InputNumber style={{ width: '100%' }} step={0.001} min={0} precision={6} />
          </Form.Item>
          <Form.Item
            label={t('costModel.editModal.outputPriceLabel')}
            name="output_price"
            rules={[{ type: 'number', min: 0 }]}
          >
            <InputNumber style={{ width: '100%' }} step={0.001} min={0} precision={6} />
          </Form.Item>
          <Form.Item label={t('costModel.editModal.currencyLabel')} name="currency">
            <Select options={CURRENCY_OPTIONS} allowClear />
          </Form.Item>
          <Form.Item
            label={t('costModel.editModal.expiryDateLabel')}
            name="expiry_date"
            extra={t('costModel.editModal.expiryDateExtra')}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label={t('costModel.editModal.isActiveLabel')}
            name="is_active"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

/**
 * Admin 组织模板管理页
 *
 * - 列表所有模板（系统 + 自定义）
 * - 创建模板（仅 admin 可见入口，后端二次校验）
 * - 删除模板（系统模板禁用删除）
 * - 使用次数展示 + 分类筛选
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
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
  Tooltip,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  orgTemplateAdminService,
  type CreateOrgTemplateRequest,
  type OrgTemplate,
  type TemplateCategory,
} from './orgTemplateService';

const { Title, Paragraph } = Typography;

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  small: 'cyan',
  medium: 'geekblue',
  large: 'purple',
  startup: 'magenta',
  enterprise: 'gold',
};

interface CreateFormValues {
  name: string;
  display_name?: string;
  description?: string;
  category?: TemplateCategory;
  is_public: boolean;
  max_members: number;
  max_executions_per_day: number;
  max_storage_gb: number;
  default_role: string;
  allow_signup: boolean;
  require_approval: boolean;
}

const DEFAULT_FORM_VALUES: CreateFormValues = {
  name: '',
  is_public: true,
  max_members: 50,
  max_executions_per_day: 1000,
  max_storage_gb: 100,
  default_role: 'member',
  allow_signup: false,
  require_approval: false,
};

export default function OrgTemplateAdminPage() {
  const { t } = useTranslation('admin');
  const [list, setList] = useState<OrgTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<CreateFormValues>();
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();

  const categoryOptions = useMemo<{ value: TemplateCategory; label: string; color: string }[]>(
    () => [
      { value: 'small', label: t('orgTemplate.categories.small'), color: CATEGORY_COLORS.small },
      { value: 'medium', label: t('orgTemplate.categories.medium'), color: CATEGORY_COLORS.medium },
      { value: 'large', label: t('orgTemplate.categories.large'), color: CATEGORY_COLORS.large },
      {
        value: 'startup',
        label: t('orgTemplate.categories.startup'),
        color: CATEGORY_COLORS.startup,
      },
      {
        value: 'enterprise',
        label: t('orgTemplate.categories.enterprise'),
        color: CATEGORY_COLORS.enterprise,
      },
    ],
    [t]
  );

  const categoryTag = useCallback(
    (category: string) => {
      const found = categoryOptions.find((o) => o.value === category);
      if (!found) return <Tag>{category || '-'}</Tag>;
      return <Tag color={found.color}>{found.label}</Tag>;
    },
    [categoryOptions]
  );

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await orgTemplateAdminService.list();
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      message.error(
        t('orgTemplate.messages.loadFailed', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const filtered = useMemo(() => {
    if (!categoryFilter) return list;
    return list.filter((tpl) => tpl.category === categoryFilter);
  }, [list, categoryFilter]);

  const openCreate = () => {
    form.setFieldsValue(DEFAULT_FORM_VALUES);
    setModalOpen(true);
  };

  const handleCreate = async () => {
    const values = await form.validateFields();
    const req: CreateOrgTemplateRequest = {
      name: values.name,
      display_name: values.display_name,
      description: values.description,
      category: values.category,
      is_public: values.is_public,
      settings: {
        max_members: values.max_members,
        max_executions_per_day: values.max_executions_per_day,
        max_storage_gb: values.max_storage_gb,
        default_role: values.default_role,
        allow_signup: values.allow_signup,
        require_approval: values.require_approval,
      },
    };
    setCreating(true);
    try {
      await orgTemplateAdminService.create(req);
      message.success(t('orgTemplate.messages.created'));
      setModalOpen(false);
      form.resetFields();
      void fetchList();
    } catch (err) {
      message.error(
        t('orgTemplate.messages.createFailed', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await orgTemplateAdminService.delete(id);
      message.success(t('orgTemplate.messages.deleted'));
      void fetchList();
    } catch (err) {
      message.error(
        t('orgTemplate.messages.deleteFailed', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    }
  };

  const columns: ColumnsType<OrgTemplate> = useMemo(
    () => [
      {
        title: t('orgTemplate.columns.name'),
        key: 'name',
        width: 240,
        render: (_, tpl) => (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{tpl.display_name || tpl.name}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {tpl.name}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: t('orgTemplate.columns.category'),
        dataIndex: 'category',
        key: 'category',
        width: 100,
        render: categoryTag,
      },
      {
        title: t('orgTemplate.columns.flags'),
        key: 'flags',
        width: 160,
        render: (_, tpl) => (
          <Space size={4} wrap>
            {tpl.is_system && <Tag color="red">{t('orgTemplate.tags.system')}</Tag>}
            {tpl.is_public ? (
              <Tag color="green">{t('orgTemplate.tags.public')}</Tag>
            ) : (
              <Tag>{t('orgTemplate.tags.private')}</Tag>
            )}
          </Space>
        ),
      },
      {
        title: t('orgTemplate.columns.limits'),
        key: 'limits',
        width: 280,
        render: (_, tpl) => (
          <Space direction="vertical" size={0} style={{ fontSize: 12 }}>
            <span>{t('orgTemplate.limits.members', { count: tpl.max_members })}</span>
            <span>
              {t('orgTemplate.limits.executionsPerDay', { count: tpl.max_executions_per_day })}
            </span>
            <span>{t('orgTemplate.limits.storage', { gb: tpl.max_storage_gb })}</span>
          </Space>
        ),
      },
      {
        title: t('orgTemplate.columns.usageCount'),
        dataIndex: 'usage_count',
        key: 'usage_count',
        width: 100,
        sorter: (a, b) => a.usage_count - b.usage_count,
      },
      {
        title: t('orgTemplate.columns.createdAt'),
        dataIndex: 'created_at',
        key: 'created_at',
        width: 180,
        render: (v: string) => new Date(v).toLocaleString(),
      },
      {
        title: t('orgTemplate.columns.actions'),
        key: 'actions',
        width: 100,
        render: (_, tpl) =>
          tpl.is_system ? (
            <Tooltip title={t('orgTemplate.delete.disabledTooltip')}>
              <Button size="small" icon={<DeleteOutlined />} disabled>
                {t('orgTemplate.delete.label')}
              </Button>
            </Tooltip>
          ) : (
            <Popconfirm
              title={t('orgTemplate.delete.title')}
              description={t('orgTemplate.delete.description', { count: tpl.usage_count })}
              onConfirm={() => void handleDelete(tpl.id)}
              okText={t('orgTemplate.delete.okText')}
              cancelText={t('orgTemplate.delete.cancelText')}
              okButtonProps={{ danger: true }}
            >
              <Button size="small" danger icon={<DeleteOutlined />}>
                {t('orgTemplate.delete.label')}
              </Button>
            </Popconfirm>
          ),
      },
    ],
    [t, categoryTag]
  );

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <Title level={3} style={{ marginBottom: 8 }}>
        {t('orgTemplate.title')}
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 16 }}>
        {t('orgTemplate.description')}
      </Paragraph>

      <Card
        bordered={false}
        title={
          <Space>
            <span>{t('orgTemplate.card.listTitle', { count: filtered.length })}</span>
            <Select
              size="small"
              placeholder={t('orgTemplate.card.categoryFilterPlaceholder')}
              allowClear
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categoryOptions.map((o) => ({ value: o.value, label: o.label }))}
              style={{ width: 140 }}
            />
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void fetchList()}>
              {t('orgTemplate.card.refresh')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              {t('orgTemplate.card.create')}
            </Button>
          </Space>
        }
      >
        <Table<OrgTemplate>
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title={t('orgTemplate.modal.title')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleCreate}
        confirmLoading={creating}
        okText={t('orgTemplate.modal.okText')}
        cancelText={t('orgTemplate.modal.cancelText')}
        width={640}
      >
        <Form<CreateFormValues>
          form={form}
          layout="vertical"
          initialValues={DEFAULT_FORM_VALUES}
          requiredMark={false}
        >
          <Form.Item
            label={t('orgTemplate.modal.fields.nameLabel')}
            name="name"
            rules={[
              { required: true, message: t('orgTemplate.modal.fields.nameRequired') },
              { min: 2, max: 50, message: t('orgTemplate.modal.fields.nameLength') },
              { pattern: /^[a-zA-Z0-9]+$/, message: t('orgTemplate.modal.fields.namePattern') },
            ]}
            extra={t('orgTemplate.modal.fields.nameExtra')}
          >
            <Input placeholder={t('orgTemplate.modal.fields.namePlaceholder')} />
          </Form.Item>
          <Form.Item
            label={t('orgTemplate.modal.fields.displayNameLabel')}
            name="display_name"
            rules={[{ max: 255 }]}
          >
            <Input placeholder={t('orgTemplate.modal.fields.displayNamePlaceholder')} />
          </Form.Item>
          <Form.Item
            label={t('orgTemplate.modal.fields.descriptionLabel')}
            name="description"
            rules={[{ max: 1000 }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label={t('orgTemplate.modal.fields.categoryLabel')} name="category">
            <Select
              allowClear
              options={categoryOptions.map((o) => ({ value: o.value, label: o.label }))}
              placeholder={t('orgTemplate.modal.fields.categoryPlaceholder')}
            />
          </Form.Item>
          <Form.Item
            label={t('orgTemplate.modal.fields.isPublicLabel')}
            name="is_public"
            valuePropName="checked"
            extra={t('orgTemplate.modal.fields.isPublicExtra')}
          >
            <Switch />
          </Form.Item>
          <Form.Item
            label={t('orgTemplate.modal.fields.maxMembersLabel')}
            name="max_members"
            rules={[{ required: true, type: 'number', min: 1 }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item
            label={t('orgTemplate.modal.fields.maxExecutionsLabel')}
            name="max_executions_per_day"
            rules={[{ required: true, type: 'number', min: 0 }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item
            label={t('orgTemplate.modal.fields.maxStorageLabel')}
            name="max_storage_gb"
            rules={[{ required: true, type: 'number', min: 0 }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item
            label={t('orgTemplate.modal.fields.defaultRoleLabel')}
            name="default_role"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: 'member', label: 'Member' },
                { value: 'admin', label: 'Admin' },
                { value: 'viewer', label: 'Viewer' },
              ]}
            />
          </Form.Item>
          <Form.Item
            label={t('orgTemplate.modal.fields.allowSignupLabel')}
            name="allow_signup"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            label={t('orgTemplate.modal.fields.requireApprovalLabel')}
            name="require_approval"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

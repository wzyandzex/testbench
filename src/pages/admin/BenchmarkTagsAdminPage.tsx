/**
 * Benchmark Tags admin 页
 *
 * 简单 CRUD：列表 + 创建（弹窗）+ 删除（Popconfirm）
 * GET 公开但只在 admin 页用；POST/DELETE 后端校验 admin
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  ColorPicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { Color } from 'antd/es/color-picker';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  benchmarkTagsService,
  type BenchmarkTag,
  type CreateBenchmarkTagRequest,
} from './benchmarkTagsService';

const { Title, Paragraph } = Typography;

interface CreateFormValues {
  name: string;
  color: Color | string;
}

const DEFAULT_COLOR = '#1677ff';

function colorString(c: Color | string): string {
  if (typeof c === 'string') return c;
  return c.toHexString();
}

export default function BenchmarkTagsAdminPage() {
  const { t } = useTranslation('admin');
  const [list, setList] = useState<BenchmarkTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<CreateFormValues>();

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await benchmarkTagsService.list();
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      message.error(
        t('benchmarkTags.messages.loadFailed', {
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

  const handleCreate = async () => {
    const values = await form.validateFields();
    const req: CreateBenchmarkTagRequest = {
      name: values.name.trim(),
      color: colorString(values.color),
    };
    setCreating(true);
    try {
      await benchmarkTagsService.create(req);
      message.success(t('benchmarkTags.messages.created'));
      setModalOpen(false);
      form.resetFields();
      void fetchList();
    } catch (err) {
      message.error(
        t('benchmarkTags.messages.createFailed', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await benchmarkTagsService.delete(id);
      message.success(t('benchmarkTags.messages.deleted'));
      void fetchList();
    } catch (err) {
      message.error(
        t('benchmarkTags.messages.deleteFailed', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    }
  };

  const columns: ColumnsType<BenchmarkTag> = useMemo(
    () => [
      { title: t('benchmarkTags.columns.id'), dataIndex: 'id', key: 'id', width: 80 },
      {
        title: t('benchmarkTags.columns.tag'),
        key: 'tag',
        render: (_, tag) => (
          <Tag color={tag.color || undefined} style={{ fontSize: 14, padding: '4px 12px' }}>
            {tag.name}
          </Tag>
        ),
      },
      {
        title: t('benchmarkTags.columns.color'),
        dataIndex: 'color',
        key: 'color',
        width: 140,
      },
      {
        title: t('benchmarkTags.columns.createdAt'),
        dataIndex: 'created_at',
        key: 'created_at',
        width: 200,
        render: (v: string) => new Date(v).toLocaleString(),
      },
      {
        title: t('benchmarkTags.columns.actions'),
        key: 'actions',
        width: 100,
        render: (_, tag) => (
          <Popconfirm
            title={t('benchmarkTags.delete.title')}
            description={t('benchmarkTags.delete.description')}
            onConfirm={() => void handleDelete(tag.id)}
            okText={t('benchmarkTags.delete.okText')}
            cancelText={t('benchmarkTags.delete.cancelText')}
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              {t('benchmarkTags.delete.label')}
            </Button>
          </Popconfirm>
        ),
      },
    ],
    [t]
  );

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Title level={3} style={{ marginBottom: 8 }}>
        {t('benchmarkTags.title')}
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 16 }}>
        {t('benchmarkTags.description')}
      </Paragraph>

      <Card
        bordered={false}
        title={t('benchmarkTags.card.listTitle', { count: list.length })}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void fetchList()}>
              {t('benchmarkTags.card.refresh')}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                form.setFieldsValue({ color: DEFAULT_COLOR });
                setModalOpen(true);
              }}
            >
              {t('benchmarkTags.card.create')}
            </Button>
          </Space>
        }
      >
        <Table<BenchmarkTag>
          rowKey="id"
          columns={columns}
          dataSource={list}
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title={t('benchmarkTags.modal.title')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleCreate}
        confirmLoading={creating}
        okText={t('benchmarkTags.modal.okText')}
        cancelText={t('benchmarkTags.modal.cancelText')}
      >
        <Form<CreateFormValues> form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label={t('benchmarkTags.modal.nameLabel')}
            name="name"
            rules={[
              { required: true, message: t('benchmarkTags.modal.nameRequired') },
              { max: 100, message: t('benchmarkTags.modal.nameMaxLength') },
            ]}
          >
            <Input placeholder={t('benchmarkTags.modal.namePlaceholder')} />
          </Form.Item>
          <Form.Item
            label={t('benchmarkTags.modal.colorLabel')}
            name="color"
            rules={[{ required: true }]}
          >
            <ColorPicker showText format="hex" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

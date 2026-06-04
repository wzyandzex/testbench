import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Col,
  ColorPicker,
  Form,
  Input,
  message,
  Radio,
  Row,
  Skeleton,
  Space,
  Typography,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';

import type { SectionConfig } from './service';
import {
  createTemplate,
  DEFAULT_SECTIONS,
  getTemplate,
  updateTemplate,
} from './service';
import { SectionConfigurator } from './components/SectionConfigurator';

const { Title } = Typography;
const { TextArea } = Input;

export default function ReportTemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form] = Form.useForm();
  const [sections, setSections] = useState<SectionConfig[]>(DEFAULT_SECTIONS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchTemplate = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const tmpl = await getTemplate(id);
      form.setFieldsValue({
        name: tmpl.name,
        description: tmpl.description,
        base_template: tmpl.base_template,
        custom_header: tmpl.custom_header,
        custom_footer: tmpl.custom_footer,
        logo_url: tmpl.logo_url,
        theme_color: tmpl.theme_color,
      });
      setSections(tmpl.sections);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [id, form]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const payload = {
        ...values,
        sections,
        theme_color: typeof values.theme_color === 'object'
          ? values.theme_color?.toHexString?.() || ''
          : values.theme_color || '',
      };

      if (isEdit && id) {
        await updateTemplate(id, payload);
        message.success('模板已更新');
      } else {
        await createTemplate(payload);
        message.success('模板已创建');
      }
      navigate('/report-templates');
    } catch {
      // form validation or API error
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card bordered={false}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </Card>
    );
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/report-templates')}>
          返回
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          {isEdit ? '编辑模板' : '创建模板'}
        </Title>
      </Space>

      <Row gutter={24}>
        <Col xs={24} lg={14}>
          <Card title="基本信息" bordered={false}>
            <Form
              form={form}
              layout="vertical"
              initialValues={{ base_template: 'summary' }}
            >
              <Form.Item
                name="name"
                label="模板名称"
                rules={[{ required: true, message: '请输入模板名称' }]}
              >
                <Input placeholder="例如：周报模板、研发评测报告" maxLength={100} />
              </Form.Item>

              <Form.Item name="description" label="描述">
                <TextArea rows={2} placeholder="模板用途描述" maxLength={500} />
              </Form.Item>

              <Form.Item
                name="base_template"
                label="基础模板"
                rules={[{ required: true }]}
              >
                <Radio.Group>
                  <Radio.Button value="summary">摘要版</Radio.Button>
                  <Radio.Button value="detailed">详细版</Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item name="custom_header" label="自定义页头（Markdown）">
                <TextArea rows={3} placeholder="报告顶部的自定义内容" />
              </Form.Item>

              <Form.Item name="custom_footer" label="自定义页脚（Markdown）">
                <TextArea rows={3} placeholder="报告底部的自定义内容" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="theme_color" label="主题色">
                    <ColorPicker showText />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="logo_url" label="Logo URL">
                    <Input placeholder="https://..." />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title="区块配置"
            bordered={false}
            extra={
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={handleSave}
              >
                {isEdit ? '保存' : '创建'}
              </Button>
            }
          >
            <SectionConfigurator sections={sections} onChange={setSections} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

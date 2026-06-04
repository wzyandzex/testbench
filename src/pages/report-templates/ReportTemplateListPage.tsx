import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  Col,
  message,
  Popconfirm,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  CrownOutlined,
  DeleteOutlined,
  EditOutlined,
  LockOutlined,
  PlusOutlined,
  StarOutlined,
} from '@ant-design/icons';

import type { TemplateInfo } from './service';
import { deleteTemplate, listTemplates, setDefaultTemplate } from './service';

const { Title, Text, Paragraph } = Typography;

export default function ReportTemplateListPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await listTemplates({ page_size: 50 });
      setTemplates(resp.data || []);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate(id);
      message.success('模板已删除');
      fetchTemplates();
    } catch {
      // handled by interceptor
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultTemplate(id);
      message.success('已设为默认模板');
      fetchTemplates();
    } catch {
      // handled by interceptor
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>报告模板</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/report-templates/create')}
        >
          创建模板
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {templates.map((tmpl) => (
          <Col xs={24} sm={12} lg={8} key={tmpl.id}>
            <Card
              loading={loading}
              hoverable
              actions={
                tmpl.is_system
                  ? [
                      <span key="system">
                        <LockOutlined /> 系统内置
                      </span>,
                    ]
                  : [
                      <EditOutlined
                        key="edit"
                        onClick={() => navigate(`/report-templates/${tmpl.id}/edit`)}
                      />,
                      !tmpl.is_default ? (
                        <StarOutlined
                          key="default"
                          onClick={() => handleSetDefault(tmpl.id)}
                        />
                      ) : (
                        <CrownOutlined key="default-active" style={{ color: '#faad14' }} />
                      ),
                      <Popconfirm
                        key="delete"
                        title="确定删除这个模板？"
                        onConfirm={() => handleDelete(tmpl.id)}
                      >
                        <DeleteOutlined />
                      </Popconfirm>,
                    ]
              }
            >
              <Card.Meta
                title={
                  <Space>
                    {tmpl.name}
                    {tmpl.is_default && <Badge count="默认" style={{ backgroundColor: '#faad14' }} />}
                    {tmpl.is_system && <Tag color="blue">系统</Tag>}
                  </Space>
                }
                description={
                  <div>
                    <Paragraph
                      ellipsis={{ rows: 2 }}
                      type="secondary"
                      style={{ marginBottom: 8 }}
                    >
                      {tmpl.description || '无描述'}
                    </Paragraph>
                    <Space size="small" wrap>
                      <Tag>{tmpl.base_template === 'summary' ? '摘要' : '详细'}</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {tmpl.sections.filter((s) => s.enabled).length} 个区块
                      </Text>
                      {tmpl.theme_color && (
                        <span
                          style={{
                            display: 'inline-block',
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: tmpl.theme_color,
                          }}
                        />
                      )}
                    </Space>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

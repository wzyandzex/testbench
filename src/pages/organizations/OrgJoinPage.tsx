import { useCallback, useEffect, useState } from 'react';
import { App, Breadcrumb, Button, Card, Form, Input, Space, Typography } from 'antd';
import { HomeOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ParticleBackground } from '@/components/agent/ParticleBackground';
import { organizationService } from '@/services/organization';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useIsDark } from '@/theme';
import {
  getGlobalStyles,
  useOrgPageContainerStyle,
  useOrgTableCardStyle,
  usePageHeaderStyle,
  useSubtitleStyle,
  useTitleStyle,
} from './style';
import { ORG_THEME } from './theme';

const { Paragraph, Title } = Typography;

interface JoinFormValues {
  org_id: string;
  invite_code: string;
}

export default function OrgJoinPage() {
  const { t } = useTranslation('organizations');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { message } = App.useApp();
  const [form] = Form.useForm<JoinFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const isDark = useIsDark();
  const theme = ORG_THEME[isDark ? 'dark' : 'light'];
  const pageContainerStyle = useOrgPageContainerStyle();
  const pageHeaderStyle = usePageHeaderStyle();
  const titleStyle = useTitleStyle();
  const subtitleStyle = useSubtitleStyle();
  const tableCardStyle = useOrgTableCardStyle();
  const fetchMemberships = useWorkspaceStore((state) => state.fetchMemberships);
  const switchOrg = useWorkspaceStore((state) => state.switchOrg);

  useEffect(() => {
    form.setFieldsValue({
      org_id: searchParams.get('org_id') || '',
      invite_code: searchParams.get('invite_code') || '',
    });
  }, [form, searchParams]);

  const handleJoin = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await organizationService.joinOrganization(values.org_id.trim(), values.invite_code.trim());
      await fetchMemberships();
      await switchOrg(values.org_id.trim());
      message.success(t('join.success'));
      navigate(`/organizations/${values.org_id.trim()}`);
    } catch (error) {
      console.error('Join organization failed:', error);
    } finally {
      setSubmitting(false);
    }
  }, [fetchMemberships, form, message, navigate, switchOrg, t]);

  return (
    <div style={pageContainerStyle}>
      <style>{getGlobalStyles(isDark)}</style>
      <ParticleBackground />

      <div style={pageHeaderStyle}>
        <Breadcrumb
          items={[
            { href: '/dashboard', title: <HomeOutlined /> },
            { href: '/organizations', title: t('list.breadcrumb') },
            { title: t('join.breadcrumb') },
          ]}
          style={{ marginBottom: 16 }}
        />

        <Title style={titleStyle}>{t('join.title')}</Title>
        <Paragraph style={{ ...subtitleStyle, marginBottom: 0, maxWidth: 720 }}>
          {t('join.description')}
        </Paragraph>
      </div>

      <Card style={{ ...tableCardStyle, maxWidth: 720 }}>
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <div
            style={{
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              padding: 16,
              color: theme.textSecondary,
              background: isDark ? 'rgba(15,23,42,0.42)' : 'rgba(248,250,252,0.92)',
            }}
          >
            {t('join.hint')}
          </div>

          <Form form={form} layout="vertical">
            <Form.Item
              label={t('join.orgIdLabel')}
              name="org_id"
              rules={[{ required: true, message: t('join.orgIdRequired') }]}
            >
              <Input placeholder={t('join.orgIdPlaceholder')} />
            </Form.Item>

            <Form.Item
              label={t('join.inviteCodeLabel')}
              name="invite_code"
              rules={[{ required: true, message: t('join.inviteCodeRequired') }]}
            >
              <Input placeholder={t('join.inviteCodePlaceholder')} />
            </Form.Item>

            <Space wrap>
              <Button
                type="primary"
                icon={<LoginOutlined />}
                loading={submitting}
                onClick={() => void handleJoin()}
              >
                {t('join.acceptBtn')}
              </Button>
              <Button onClick={() => navigate('/organizations')}>{t('join.backBtn')}</Button>
            </Space>
          </Form>
        </Space>
      </Card>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import {
  CheckOutlined,
  HomeOutlined,
  MailOutlined,
  PlusOutlined,
  RocketOutlined,
  SwapOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { ParticleBackground } from '@/components/agent/ParticleBackground';
import { useIsDark } from '@/theme';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useOrgTemplateStore } from '@/stores/orgTemplateStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { organizationService } from '@/services/organization';
import type { Membership } from '@/types/workspace';
import type { OrgTemplate, OrganizationUserInvitation } from '@/types/organization';
import {
  getGlobalStyles,
  useOrgPageContainerStyle,
  useOrgTableCardStyle,
  usePageHeaderStyle,
  useSubtitleStyle,
  useTitleStyle,
} from './style';
import { ORG_THEME } from './theme';

const { Paragraph, Text, Title } = Typography;
const { TextArea } = Input;

const getNameRules = () => [
  { required: true, message: i18next.t('organizations:form.slugRequired') },
  { min: 3, message: i18next.t('organizations:form.slugMin') },
  { max: 50, message: i18next.t('organizations:form.slugMax') },
  {
    pattern: /^[a-zA-Z0-9]+$/,
    message: i18next.t('organizations:form.slugFormat'),
  },
];

const getRoleLabel = (role: Membership['role']): string => {
  return i18next.t(`organizations:role.${role}`);
};

function SummaryCard({ title, value, helper }: { title: string; value: number; helper: string }) {
  const isDark = useIsDark();
  const theme = ORG_THEME[isDark ? 'dark' : 'light'];

  return (
    <Card
      style={{
        borderRadius: 18,
        border: `1px solid ${theme.border}`,
        background: isDark
          ? 'linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(124,58,237,0.08) 100%)'
          : 'linear-gradient(135deg, rgba(22,119,255,0.04) 0%, rgba(16,185,129,0.04) 100%)',
        boxShadow: theme.cardShadow,
      }}
    >
      <Text type="secondary">{title}</Text>
      <div
        style={{
          marginTop: 10,
          fontSize: 30,
          fontWeight: 700,
          color: theme.textPrimary,
        }}
      >
        {value}
      </div>
      <Text style={{ color: theme.textSecondary }}>{helper}</Text>
    </Card>
  );
}

function TemplateCard({
  template,
  selected,
  onSelect,
}: {
  template: OrgTemplate;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation('organizations');
  const isDark = useIsDark();
  const theme = ORG_THEME[isDark ? 'dark' : 'light'];

  return (
    <Card
      hoverable
      onClick={onSelect}
      style={{
        borderRadius: 16,
        border: `1px solid ${selected ? (isDark ? theme.neonCyan : '#1677ff') : theme.border}`,
        boxShadow: selected ? theme.cardHoverShadow : theme.cardShadow,
      }}
    >
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{template.display_name}</div>
            <Text type="secondary">{template.name}</Text>
          </div>
          {template.category ? <Tag color="blue">{template.category}</Tag> : null}
        </div>
        <Paragraph style={{ marginBottom: 0, minHeight: 44 }}>
          {template.description || t('create.templateDefault')}
        </Paragraph>
        <Space size={16} wrap>
          <Text>{t('list.memberLimit', { limit: template.settings.max_members })}</Text>
          <Text>{t('list.dailyExec', { limit: template.settings.max_executions_per_day })}</Text>
          <Text>{t('list.storage', { limit: template.settings.max_storage_gb })}</Text>
        </Space>
      </Space>
    </Card>
  );
}

function OrganizationCard({
  membership,
  isCurrent,
  onEnter,
  onSwitchOnly,
}: {
  membership: Membership;
  isCurrent: boolean;
  onEnter: () => void;
  onSwitchOnly: () => void;
}) {
  const { t } = useTranslation('organizations');
  const isDark = useIsDark();
  const theme = ORG_THEME[isDark ? 'dark' : 'light'];

  return (
    <Card
      hoverable
      style={{
        height: '100%',
        borderRadius: 20,
        border: `1px solid ${theme.border}`,
        boxShadow: theme.cardShadow,
        overflow: 'hidden',
      }}
    >
      <Space direction="vertical" size={18} style={{ width: '100%' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            flexWrap: 'wrap',
            minWidth: 0,
          }}
        >
          <Space align="start" style={{ flex: '1 1 220px', minWidth: 0, maxWidth: '100%' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                display: 'grid',
                placeItems: 'center',
                background:
                  membership.org_type === 'personal'
                    ? 'rgba(22,119,255,0.12)'
                    : 'rgba(16,185,129,0.12)',
                color: membership.org_type === 'personal' ? '#1677ff' : '#10b981',
                flex: '0 0 auto',
              }}
            >
              {membership.org_type === 'personal' ? <UserOutlined /> : <TeamOutlined />}
            </div>
            <div style={{ minWidth: 0, maxWidth: '100%' }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: theme.textPrimary,
                  lineHeight: 1.35,
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word',
                }}
              >
                {membership.display_name || membership.org_name}
              </div>
              <Text
                type="secondary"
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word',
                }}
              >
                {membership.org_name}
              </Text>
            </div>
          </Space>
          <Space
            wrap
            style={{
              flex: '0 1 auto',
              minWidth: 0,
              maxWidth: '100%',
              justifyContent: 'flex-end',
            }}
          >
            {isCurrent ? <Tag color="gold">{t('list.currentContextTag')}</Tag> : null}
            <Tag color={membership.org_type === 'personal' ? 'blue' : 'green'}>
              {membership.org_type === 'personal'
                ? t('list.personalTypeTag')
                : t('list.teamTypeTag')}
            </Tag>
          </Space>
        </div>

        <Space wrap>
          <Tag color={membership.is_owner ? 'gold' : 'default'}>
            {membership.is_owner ? t('role.owner') : getRoleLabel(membership.role)}
          </Tag>
          <Text type="secondary">
            {t('list.joinedAt', { date: dayjs(membership.joined_at).format('YYYY-MM-DD') })}
          </Text>
        </Space>

        <Paragraph style={{ color: theme.textSecondary, marginBottom: 0 }}>
          {membership.org_type === 'personal' ? t('detail.personalDesc') : t('detail.teamDesc')}
        </Paragraph>

        <Space wrap>
          <Button type="primary" icon={<RocketOutlined />} onClick={onEnter}>
            {isCurrent ? t('detail.enterManage') : t('detail.switchEnter')}
          </Button>
          {!isCurrent ? (
            <Button icon={<SwapOutlined />} onClick={onSwitchOnly}>
              {t('list.switchOnlyBtn')}
            </Button>
          ) : null}
        </Space>
      </Space>
    </Card>
  );
}

function PendingInvitationCard({
  invitation,
  accepting,
  onAccept,
}: {
  invitation: OrganizationUserInvitation;
  accepting: boolean;
  onAccept: () => void;
}) {
  const { t } = useTranslation('organizations');
  const isDark = useIsDark();
  const theme = ORG_THEME[isDark ? 'dark' : 'light'];
  const orgName =
    invitation.organization_display_name || invitation.organization_name || invitation.org_id;

  return (
    <Card
      style={{
        height: '100%',
        borderRadius: 16,
        border: `1px solid ${theme.border}`,
        boxShadow: theme.cardShadow,
      }}
    >
      <Space direction="vertical" size={14} style={{ width: '100%' }}>
        <Space align="start">
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              display: 'grid',
              placeItems: 'center',
              background: isDark ? 'rgba(16,185,129,0.14)' : 'rgba(16,185,129,0.10)',
              color: '#10b981',
              flex: '0 0 auto',
            }}
          >
            <MailOutlined />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary }}>{orgName}</div>
            <Text style={{ color: theme.textSecondary }}>
              {invitation.inviter_username
                ? t('myInvitations.invitedBy', { name: invitation.inviter_username })
                : t('myInvitations.invited')}
            </Text>
          </div>
        </Space>

        <Space wrap>
          <Tag color="blue">{getRoleLabel(invitation.role)}</Tag>
          <Text type="secondary">
            {t('myInvitations.expiresAt', {
              date: dayjs(invitation.expires_at).format('YYYY-MM-DD HH:mm'),
            })}
          </Text>
        </Space>

        <Button type="primary" icon={<CheckOutlined />} loading={accepting} onClick={onAccept}>
          {t('myInvitations.acceptBtn')}
        </Button>
      </Space>
    </Card>
  );
}

export default function OrgListPage() {
  const { t } = useTranslation('organizations');
  const navigate = useNavigate();
  const { message } = App.useApp();
  const isDark = useIsDark();
  const theme = ORG_THEME[isDark ? 'dark' : 'light'];
  const pageContainerStyle = useOrgPageContainerStyle();
  const pageHeaderStyle = usePageHeaderStyle();
  const titleStyle = useTitleStyle();
  const subtitleStyle = useSubtitleStyle();
  const tableCardStyle = useOrgTableCardStyle();

  const currentOrg = useWorkspaceStore((state) => state.currentOrg);
  const memberships = useWorkspaceStore((state) => state.memberships);
  const fetchMemberships = useWorkspaceStore((state) => state.fetchMemberships);
  const switchOrg = useWorkspaceStore((state) => state.switchOrg);
  const isSwitching = useWorkspaceStore((state) => state.isSwitching);

  const createOrganization = useOrganizationStore((state) => state.createOrganization);
  const {
    templates,
    fetchTemplates,
    createOrgFromTemplate,
    loading: templateLoading,
  } = useOrgTemplateStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'direct' | 'template'>('direct');
  const [selectedTemplate, setSelectedTemplate] = useState<OrgTemplate | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [myInvitations, setMyInvitations] = useState<OrganizationUserInvitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [acceptingInvitationId, setAcceptingInvitationId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const loadMyInvitations = useCallback(async () => {
    setInvitationsLoading(true);
    try {
      const invitations = await organizationService.getMyInvitations();
      setMyInvitations(invitations);
    } catch (error) {
      console.error('Load my invitations failed:', error);
    } finally {
      setInvitationsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMemberships();
  }, [fetchMemberships]);

  useEffect(() => {
    void loadMyInvitations();
  }, [loadMyInvitations]);

  useEffect(() => {
    if (modalOpen && createMode === 'template' && templates.length === 0) {
      void fetchTemplates({ is_public: true });
    }
  }, [createMode, fetchTemplates, modalOpen, templates.length]);

  const stats = useMemo(
    () => ({
      total: memberships.length,
      team: memberships.filter((membership) => membership.org_type === 'team').length,
      personal: memberships.filter((membership) => membership.org_type === 'personal').length,
      admin: memberships.filter((membership) => membership.role === 'admin').length,
    }),
    [memberships]
  );

  const openCreateModal = useCallback(
    (mode: 'direct' | 'template') => {
      setCreateMode(mode);
      setSelectedTemplate(null);
      form.resetFields();
      setModalOpen(true);
    },
    [form]
  );

  const handleSwitchOnly = useCallback(
    async (membership: Membership) => {
      try {
        await switchOrg(membership.org_id);
        message.success(
          t('list.switched', { name: membership.display_name || membership.org_name })
        );
      } catch (error) {
        console.error('Switch organization failed:', error);
      }
    },
    [message, switchOrg, t]
  );

  const handleEnterOrganization = useCallback(
    async (membership: Membership) => {
      try {
        if (currentOrg?.org_id !== membership.org_id) {
          await switchOrg(membership.org_id);
        }
        navigate(`/organizations/${membership.org_id}`);
      } catch (error) {
        console.error('Enter organization failed:', error);
      }
    },
    [currentOrg?.org_id, navigate, switchOrg]
  );

  const handleAcceptInvitation = useCallback(
    async (invitation: OrganizationUserInvitation) => {
      try {
        setAcceptingInvitationId(invitation.id);
        await organizationService.joinOrganization(invitation.org_id, invitation.invite_code);
        await fetchMemberships();
        await switchOrg(invitation.org_id);
        setMyInvitations((items) => items.filter((item) => item.id !== invitation.id));
        message.success(t('myInvitations.accepted'));
        navigate(`/organizations/${invitation.org_id}`);
      } catch (error) {
        console.error('Accept invitation failed:', error);
      } finally {
        setAcceptingInvitationId(null);
      }
    },
    [fetchMemberships, message, navigate, switchOrg, t]
  );

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();

      if (createMode === 'template' && !selectedTemplate) {
        message.warning(t('create.selectTemplate'));
        return;
      }

      setSubmitting(true);

      const organization =
        createMode === 'template' && selectedTemplate
          ? await createOrgFromTemplate(selectedTemplate.id, {
              name: values.name,
              display_name: values.display_name || values.name,
              description: values.description,
            })
          : await createOrganization({
              name: values.name,
              display_name: values.display_name || values.name,
              description: values.description,
            });

      await fetchMemberships();
      await switchOrg(organization.id);

      message.success(t('create.success'));
      setModalOpen(false);
      setSelectedTemplate(null);
      form.resetFields();
      navigate(`/organizations/${organization.id}`);
    } catch (error) {
      console.error('Create organization failed:', error);
    } finally {
      setSubmitting(false);
    }
  }, [
    createMode,
    createOrgFromTemplate,
    createOrganization,
    fetchMemberships,
    form,
    message,
    navigate,
    selectedTemplate,
    switchOrg,
    t,
  ]);

  return (
    <div style={pageContainerStyle}>
      <style>{getGlobalStyles(isDark)}</style>
      <ParticleBackground />

      <div style={pageHeaderStyle}>
        <Breadcrumb
          items={[{ href: '/dashboard', title: <HomeOutlined /> }, { title: t('list.breadcrumb') }]}
          style={{ marginBottom: 16 }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <Title style={titleStyle}>{t('list.pageTitle')}</Title>
            <Paragraph style={{ ...subtitleStyle, marginBottom: 0, maxWidth: 720 }}>
              {t('list.pageSubtitle')}
            </Paragraph>
          </div>
          <Space wrap>
            <Button icon={<PlusOutlined />} onClick={() => openCreateModal('template')}>
              {t('list.templateCreateBtn')}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openCreateModal('direct')}
            >
              {t('list.directCreateBtn')}
            </Button>
          </Space>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <SummaryCard
            title={t('stats.availableOrgs')}
            value={stats.total}
            helper={t('stats.availableOrgsHelper')}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <SummaryCard
            title={t('stats.teamOrgs')}
            value={stats.team}
            helper={t('stats.teamOrgsHelper')}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <SummaryCard
            title={t('stats.personalWorkspace')}
            value={stats.personal}
            helper={t('stats.personalWorkspaceHelper')}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <SummaryCard
            title={t('stats.adminRole')}
            value={stats.admin}
            helper={t('stats.adminRoleHelper')}
          />
        </Col>
      </Row>

      {invitationsLoading || myInvitations.length > 0 ? (
        <Card loading={invitationsLoading} style={{ ...tableCardStyle, marginBottom: 24 }}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <Title level={4} style={{ margin: 0, color: theme.textPrimary }}>
                {t('myInvitations.title')}
              </Title>
              <Paragraph style={{ margin: '6px 0 0', color: theme.textSecondary }}>
                {t('myInvitations.description')}
              </Paragraph>
            </div>

            {myInvitations.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('myInvitations.empty')} />
            ) : (
              <Row gutter={[16, 16]}>
                {myInvitations.map((invitation) => (
                  <Col xs={24} md={12} xl={8} key={invitation.id}>
                    <PendingInvitationCard
                      invitation={invitation}
                      accepting={acceptingInvitationId === invitation.id}
                      onAccept={() => void handleAcceptInvitation(invitation)}
                    />
                  </Col>
                ))}
              </Row>
            )}
          </Space>
        </Card>
      ) : null}

      <Card style={tableCardStyle}>
        {memberships.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('detail.noOrgs')}
            style={{ padding: '48px 0' }}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {memberships.map((membership) => (
              <Col xs={24} md={12} xl={8} key={membership.org_id}>
                <OrganizationCard
                  membership={membership}
                  isCurrent={membership.org_id === currentOrg?.org_id}
                  onEnter={() => void handleEnterOrganization(membership)}
                  onSwitchOnly={() => void handleSwitchOnly(membership)}
                />
              </Col>
            ))}
          </Row>
        )}
      </Card>

      <Modal
        title={createMode === 'direct' ? t('create.title') : t('create.templateTitle')}
        open={modalOpen}
        onOk={() => void handleSubmit()}
        onCancel={() => setModalOpen(false)}
        okText={t('create.okText')}
        cancelText={t('list.cancel')}
        confirmLoading={submitting || isSwitching}
        width={920}
        destroyOnClose
      >
        <Tabs
          activeKey={createMode}
          onChange={(key) => setCreateMode(key as 'direct' | 'template')}
          items={[
            {
              key: 'direct',
              label: t('create.directCreate'),
              children: null,
            },
            {
              key: 'template',
              label: t('create.templateCreate'),
              children: null,
            },
          ]}
        />

        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label={t('form.slugLabel')}
                name="name"
                extra={t('form.slugExtra')}
                rules={getNameRules()}
              >
                <Input placeholder={t('form.slugPlaceholder')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label={t('form.displayName')}
                name="display_name"
                extra={t('form.displayNameExtra')}
                rules={[{ max: 255, message: t('form.displayNameMax') }]}
              >
                <Input placeholder={t('form.displayNamePlaceholder')} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={t('form.descLabel')}
            name="description"
            rules={[{ max: 1000, message: t('form.descMax') }]}
          >
            <TextArea rows={4} placeholder={t('form.descPlaceholder')} showCount maxLength={1000} />
          </Form.Item>

          {createMode === 'template' ? (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Text strong>{t('list.templateSelectTitle')}</Text>
              <Row gutter={[16, 16]}>
                {templates.map((template) => (
                  <Col xs={24} lg={12} key={template.id}>
                    <TemplateCard
                      template={template}
                      selected={selectedTemplate?.id === template.id}
                      onSelect={() => setSelectedTemplate(template)}
                    />
                  </Col>
                ))}
              </Row>
              {!templateLoading && templates.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('create.noTemplates')} />
              ) : null}
            </Space>
          ) : (
            <Card
              size="small"
              style={{
                borderRadius: 14,
                border: `1px solid ${theme.border}`,
                background: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa',
              }}
            >
              <Space direction="vertical" size={4}>
                <Text strong>{t('list.defaultStrategyTitle')}</Text>
                <Text type="secondary">{t('list.defaultStrategyDesc')}</Text>
              </Space>
            </Card>
          )}
        </Form>
      </Modal>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeftOutlined,
  CopyOutlined,
  DeleteOutlined,
  HomeOutlined,
  MailOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { ParticleBackground } from '@/components/agent/ParticleBackground';
import { InviteMemberModal, QuotaCard } from '@/components/organization';
import { usePersonalOrg } from '@/hooks/usePersonalOrg';
import { useIsDark } from '@/theme';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import type {
  OrganizationInvitation,
  OrganizationMember,
  OrganizationMemberRole,
} from '@/types/organization';
import {
  getGlobalStyles,
  useOrgPageContainerStyle,
  useOrgTableCardStyle,
  usePageHeaderStyle,
  useSubtitleStyle,
  useTabStyles,
  useTitleStyle,
} from './style';

const { Paragraph, Text, Title } = Typography;
const { TextArea } = Input;

const roleColorMap: Record<OrganizationMemberRole, string> = {
  admin: 'blue',
  member: 'green',
  guest: 'default',
};

const getRoleLabel = (role: OrganizationMemberRole): string => {
  return i18next.t(`organizations:role.${role}`);
};

const invitationStatusColorMap: Record<OrganizationInvitation['status'], string> = {
  pending: 'processing',
  accepted: 'success',
  cancelled: 'default',
  expired: 'error',
};

const getInviteStatusLabel = (status: OrganizationInvitation['status']): string => {
  return i18next.t(`organizations:inviteStatus.${status}`);
};

function RoleBadge({ role, isOwner }: { role: OrganizationMemberRole; isOwner?: boolean }) {
  if (isOwner) {
    return <Tag color="gold">Owner</Tag>;
  }

  return <Tag color={roleColorMap[role]}>{getRoleLabel(role)}</Tag>;
}

export default function OrgDetailPage() {
  const { t } = useTranslation('organizations');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const isDark = useIsDark();
  const pageContainerStyle = useOrgPageContainerStyle();
  const pageHeaderStyle = usePageHeaderStyle();
  const titleStyle = useTitleStyle();
  const subtitleStyle = useSubtitleStyle();
  const tableCardStyle = useOrgTableCardStyle();
  const tabStyles = useTabStyles();

  const currentOrg = useWorkspaceStore((state) => state.currentOrg);
  const switchOrg = useWorkspaceStore((state) => state.switchOrg);
  const autoSelectOrg = useWorkspaceStore((state) => state.autoSelectOrg);

  const {
    selectedOrganization,
    members,
    membersMeta,
    invitations,
    quota,
    loading,
    fetchOrganizationDetail,
    fetchMembers,
    fetchInvitations,
    fetchQuota,
    updateOrganization,
    updateSettings,
    deleteOrganization,
    updateMemberRole,
    removeMember,
    cancelInvitation,
    resendInvitation,
    clearSelectedOrganization,
  } = useOrganizationStore();

  const { isPersonalOrg, isAdmin, canDelete, canInvite } = usePersonalOrg();

  const [basicForm] = Form.useForm();
  const [settingsForm] = Form.useForm();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [savingBasic, setSavingBasic] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [preparingContext, setPreparingContext] = useState(false);

  const canManage = currentOrg?.org_id === id && isAdmin;
  const membersPagination = membersMeta
    ? {
        current: membersMeta.page,
        pageSize: membersMeta.size,
        total: membersMeta.total,
        showSizeChanger: true,
      }
    : false;

  const pageLoading =
    preparingContext || loading || !id || !selectedOrganization || selectedOrganization.id !== id;

  const loadOrganization = useCallback(async () => {
    if (!id) {
      return;
    }

    if (currentOrg?.org_id !== id) {
      await switchOrg(id);
      return;
    }

    await Promise.all([
      fetchOrganizationDetail(id),
      fetchQuota(id),
      canManage ? fetchInvitations(id) : Promise.resolve([]),
    ]);

    if (!canManage) {
      useOrganizationStore.setState({ invitations: [] });
    }
  }, [
    canManage,
    currentOrg?.org_id,
    fetchInvitations,
    fetchOrganizationDetail,
    fetchQuota,
    id,
    switchOrg,
  ]);

  useEffect(() => {
    let active = true;
    clearSelectedOrganization();

    const run = async () => {
      if (!id) {
        return;
      }

      setPreparingContext(true);
      try {
        await loadOrganization();
      } catch (error) {
        console.error('Load organization failed:', error);
        if (active) {
          navigate('/organizations');
        }
      } finally {
        if (active) {
          setPreparingContext(false);
        }
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [clearSelectedOrganization, id, loadOrganization, navigate]);

  useEffect(() => {
    if (!selectedOrganization) {
      return;
    }

    basicForm.setFieldsValue({
      display_name: selectedOrganization.display_name,
      description: selectedOrganization.description,
    });

    settingsForm.setFieldsValue({
      max_members: selectedOrganization.settings.max_members,
      max_executions_per_day: selectedOrganization.settings.max_executions_per_day,
      max_storage_gb: selectedOrganization.settings.max_storage_gb,
      default_role: selectedOrganization.settings.default_role,
      allow_signup: selectedOrganization.settings.allow_signup,
      require_approval: selectedOrganization.settings.require_approval,
    });
  }, [basicForm, selectedOrganization, settingsForm]);

  const handleRefresh = useCallback(async () => {
    try {
      await loadOrganization();
      message.success(t('actions.refreshed'));
    } catch (error) {
      console.error('Refresh organization failed:', error);
    }
  }, [loadOrganization, message, t]);

  const handleSaveBasic = useCallback(async () => {
    if (!id) {
      return;
    }

    try {
      const values = await basicForm.validateFields();
      setSavingBasic(true);
      await updateOrganization(id, {
        display_name: values.display_name,
        description: values.description,
      });
      message.success(t('settings.basicUpdated'));
    } catch (error) {
      console.error('Save organization basic info failed:', error);
    } finally {
      setSavingBasic(false);
    }
  }, [basicForm, id, message, updateOrganization, t]);

  const handleSaveSettings = useCallback(async () => {
    if (!id) {
      return;
    }

    try {
      const values = await settingsForm.validateFields();
      setSavingSettings(true);
      await updateSettings(id, values);
      await fetchQuota(id);
      message.success(t('settings.updated'));
    } catch (error) {
      console.error('Save organization settings failed:', error);
    } finally {
      setSavingSettings(false);
    }
  }, [fetchQuota, id, message, settingsForm, updateSettings, t]);

  const handleDeleteOrganization = useCallback(() => {
    if (!id || !selectedOrganization) {
      return;
    }

    Modal.confirm({
      title: t('actions.deleteTitle'),
      content: t('detail.deleteContent', { name: selectedOrganization.display_name }),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteOrganization(id);
          await autoSelectOrg();
          message.success(t('actions.deleted'));
          navigate('/organizations');
        } catch (error) {
          console.error('Delete organization failed:', error);
        }
      },
    });
  }, [autoSelectOrg, deleteOrganization, id, message, navigate, selectedOrganization, t]);

  const handleRemoveMember = useCallback(
    (member: OrganizationMember) => {
      if (!id) {
        return;
      }

      Modal.confirm({
        title: t('members.removeTitle'),
        content: t('detail.memberRemoveContent', { name: member.username || member.email }),
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await removeMember(id, member.user_id);
            await fetchQuota(id);
            message.success(t('members.removed'));
          } catch (error) {
            console.error('Remove member failed:', error);
          }
        },
      });
    },
    [fetchQuota, id, message, removeMember, t]
  );

  const handleRoleChange = useCallback(
    async (member: OrganizationMember, role: OrganizationMemberRole) => {
      if (!id || member.is_owner || member.role === role) {
        return;
      }

      try {
        await updateMemberRole(id, member.user_id, role);
        message.success(t('members.roleUpdated'));
      } catch (error) {
        console.error('Update member role failed:', error);
      }
    },
    [id, message, updateMemberRole, t]
  );

  const handleMembersPageChange = useCallback(
    async (page: number, pageSize: number) => {
      if (!id) {
        return;
      }

      try {
        await fetchMembers(id, { page, pageSize });
      } catch (error) {
        console.error('Load members page failed:', error);
      }
    },
    [fetchMembers, id]
  );

  const handleCancelInvitation = useCallback(
    (invitation: OrganizationInvitation) => {
      if (!id) {
        return;
      }

      Modal.confirm({
        title: t('invites.cancelTitle'),
        content: t('detail.cancelInviteContent', { email: invitation.email }),
        onOk: async () => {
          try {
            await cancelInvitation(id, invitation.id);
            message.success(t('invites.cancelled'));
          } catch (error) {
            console.error('Cancel invitation failed:', error);
          }
        },
      });
    },
    [cancelInvitation, id, message, t]
  );

  const handleResendInvitation = useCallback(
    async (invitation: OrganizationInvitation) => {
      if (!id) {
        return;
      }

      try {
        const resent = await resendInvitation(id, invitation.id, 168);
        if (!resent.delivery_status || resent.delivery_status === 'sent') {
          message.success(t('detail.resendSuccess', { email: invitation.email }));
        } else {
          message.warning(t('detail.resendDeliveryFallback', { email: invitation.email }));
        }
      } catch (error) {
        console.error('Resend invitation failed:', error);
      }
    },
    [id, message, resendInvitation, t]
  );

  const memberColumns = useMemo<ColumnsType<OrganizationMember>>(
    () => [
      {
        title: t('members.nameCol'),
        dataIndex: 'username',
        key: 'username',
        render: (_, record) => (
          <Space>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                display: 'grid',
                placeItems: 'center',
                background: isDark ? 'rgba(0,212,255,0.12)' : 'rgba(22,119,255,0.08)',
                color: isDark ? '#00d4ff' : '#1677ff',
              }}
            >
              <UserOutlined />
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{record.username || record.email}</div>
              <Text type="secondary">{record.email}</Text>
            </div>
          </Space>
        ),
      },
      {
        title: t('members.roleCol'),
        dataIndex: 'role',
        key: 'role',
        width: 220,
        render: (_, record) =>
          canManage && !record.is_owner ? (
            <Select
              value={record.role}
              style={{ width: 140 }}
              onChange={(value) => void handleRoleChange(record, value)}
              options={[
                { label: t('role.admin'), value: 'admin' },
                { label: t('role.member'), value: 'member' },
                { label: t('role.guest'), value: 'guest' },
              ]}
            />
          ) : (
            <RoleBadge role={record.role} isOwner={record.is_owner} />
          ),
      },
      {
        title: t('members.joinedCol'),
        dataIndex: 'joined_at',
        key: 'joined_at',
        width: 160,
        render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
      },
      {
        title: t('members.actionCol'),
        key: 'actions',
        width: 120,
        render: (_, record) =>
          canManage && !record.is_owner ? (
            <Button danger type="link" onClick={() => handleRemoveMember(record)}>
              {t('detail.remove')}
            </Button>
          ) : (
            <Text type="secondary">-</Text>
          ),
      },
    ],
    [canManage, handleRemoveMember, handleRoleChange, isDark, t]
  );

  const invitationColumns = useMemo<ColumnsType<OrganizationInvitation>>(
    () => [
      {
        title: t('invites.emailCol'),
        dataIndex: 'email',
        key: 'email',
        render: (value: string) => (
          <Space>
            <MailOutlined />
            <span>{value}</span>
          </Space>
        ),
      },
      {
        title: t('invites.roleCol'),
        dataIndex: 'role',
        key: 'role',
        width: 110,
        render: (role: OrganizationInvitation['role']) => <RoleBadge role={role} />,
      },
      {
        title: t('invites.statusCol'),
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (status: OrganizationInvitation['status']) => (
          <Tag color={invitationStatusColorMap[status]}>{getInviteStatusLabel(status)}</Tag>
        ),
      },
      {
        title: t('invites.codeCol'),
        dataIndex: 'invite_code',
        key: 'invite_code',
        width: 180,
        render: (code: string) => (
          <Typography.Text copyable={{ text: code, icon: <CopyOutlined /> }}>
            {code}
          </Typography.Text>
        ),
      },
      {
        title: t('invites.expiresCol'),
        dataIndex: 'expires_at',
        key: 'expires_at',
        width: 180,
        render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
      },
      {
        title: t('invites.actionCol'),
        key: 'actions',
        width: 160,
        render: (_, record) =>
          record.status === 'pending' ? (
            <Space size={0}>
              <Button type="link" onClick={() => void handleResendInvitation(record)}>
                {t('detail.resendInvite')}
              </Button>
              <Button type="link" danger onClick={() => handleCancelInvitation(record)}>
                {t('detail.cancelInvite')}
              </Button>
            </Space>
          ) : (
            <Text type="secondary">-</Text>
          ),
      },
    ],
    [handleCancelInvitation, handleResendInvitation, t]
  );

  const tabItems = useMemo(() => {
    const overview = (
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            title={t('settings.basicInfo')}
            style={tableCardStyle}
            extra={!canManage ? <Text type="secondary">{t('detail.onlyAdminEdit')}</Text> : null}
          >
            <Form form={basicForm} layout="vertical" disabled={!canManage}>
              <Form.Item
                label={t('form.displayName')}
                name="display_name"
                rules={[
                  { required: true, message: t('form.displayNameRequired') },
                  { max: 255, message: t('form.displayNameMaxShort') },
                ]}
              >
                <Input placeholder={t('detail.memberPlaceholder')} />
              </Form.Item>
              <Form.Item
                label={t('form.descLabel')}
                name="description"
                rules={[{ max: 1000, message: t('form.descMaxShort') }]}
              >
                <TextArea
                  rows={5}
                  placeholder={t('form.descPlaceholderAlt')}
                  showCount
                  maxLength={1000}
                />
              </Form.Item>
              {canManage ? (
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={savingBasic}
                  onClick={() => void handleSaveBasic()}
                >
                  {t('detail.saveBasic')}
                </Button>
              ) : null}
            </Form>
          </Card>
        </Col>

        <Col xs={24} xl={10}>
          <QuotaCard quota={quota} loading={pageLoading} />
        </Col>

        <Col xs={24}>
          <Card
            title={t('settings.title')}
            style={tableCardStyle}
            extra={!canManage ? <Text type="secondary">{t('detail.readOnly')}</Text> : null}
          >
            <Form form={settingsForm} layout="vertical" disabled={!canManage}>
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label={t('settings.memberLimit')}
                    name="max_members"
                    rules={[{ required: true, message: t('settings.memberLimitRequired') }]}
                  >
                    <InputNumber min={1} max={10000} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label={t('settings.dailyExecLimit')}
                    name="max_executions_per_day"
                    rules={[{ required: true, message: t('settings.dailyExecRequired') }]}
                  >
                    <InputNumber min={1} max={100000} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label={t('settings.storageLimit')}
                    name="max_storage_gb"
                    rules={[{ required: true, message: t('settings.storageLimitRequired') }]}
                  >
                    <InputNumber min={1} max={10000} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label={t('settings.defaultRole')}
                    name="default_role"
                    rules={[{ required: true, message: t('settings.defaultRoleRequired') }]}
                  >
                    <Select
                      options={[
                        { label: t('role.admin'), value: 'admin' },
                        { label: t('role.member'), value: 'member' },
                        { label: t('role.guest'), value: 'guest' },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label={t('settings.allowSignup')}
                    name="allow_signup"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    label={t('settings.requireApproval')}
                    name="require_approval"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              {canManage ? (
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={savingSettings}
                  onClick={() => void handleSaveSettings()}
                >
                  {t('detail.saveSettings')}
                </Button>
              ) : null}
            </Form>
          </Card>
        </Col>
      </Row>
    );

    const memberTab = (
      <Card
        title={t('members.title')}
        style={tableCardStyle}
        extra={
          <Text type="secondary">
            {membersMeta
              ? t('members.total', { total: membersMeta.total })
              : t('members.loadingHint')}
          </Text>
        }
      >
        <Table
          columns={memberColumns}
          dataSource={members}
          rowKey="id"
          pagination={
            membersPagination
              ? {
                  ...membersPagination,
                  onChange: (page, pageSize) => {
                    void handleMembersPageChange(page, pageSize);
                  },
                }
              : false
          }
        />
      </Card>
    );

    const items = [
      {
        key: 'overview',
        label: <span style={tabStyles}>{t('detail.tabOverview')}</span>,
        children: overview,
      },
      {
        key: 'members',
        label: <span style={tabStyles}>{t('detail.tabMembers')}</span>,
        children: memberTab,
      },
    ];

    if (canManage) {
      items.push({
        key: 'invitations',
        label: <span style={tabStyles}>{t('detail.tabInvitations')}</span>,
        children: (
          <Card
            title={t('invites.title')}
            style={tableCardStyle}
            extra={
              <Space>
                <Text type="secondary">
                  {quota
                    ? t('invites.remainingSeats', { count: quota.members.remaining })
                    : t('invites.quotaLoading')}
                </Text>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setInviteModalOpen(true)}
                  disabled={!canInvite}
                >
                  {t('detail.inviteMember')}
                </Button>
              </Space>
            }
          >
            {invitations.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('invites.noInvites')}
                style={{ padding: '32px 0' }}
              />
            ) : (
              <Table
                columns={invitationColumns}
                dataSource={invitations}
                rowKey="id"
                pagination={false}
              />
            )}
          </Card>
        ),
      });
    }

    return items;
  }, [
    basicForm,
    canInvite,
    canManage,
    handleMembersPageChange,
    handleSaveBasic,
    handleSaveSettings,
    invitationColumns,
    invitations,
    memberColumns,
    members,
    membersMeta,
    membersPagination,
    pageLoading,
    quota,
    savingBasic,
    savingSettings,
    settingsForm,
    tabStyles,
    tableCardStyle,
    t,
  ]);

  return (
    <div style={pageContainerStyle}>
      <style>{getGlobalStyles(isDark)}</style>
      <ParticleBackground />

      <div style={pageHeaderStyle}>
        <Breadcrumb
          items={[
            { href: '/dashboard', title: <HomeOutlined /> },
            { href: '/organizations', title: t('list.breadcrumb') },
            { title: selectedOrganization?.display_name || t('detail.fallbackDetail') },
          ]}
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
            <Space align="center" wrap>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/organizations')}>
                {t('detail.backToList')}
              </Button>
              {selectedOrganization ? (
                <>
                  <Tag color={selectedOrganization.type === 'personal' ? 'blue' : 'green'}>
                    {selectedOrganization.type === 'personal'
                      ? t('list.personalTypeTag')
                      : t('list.teamTypeTag')}
                  </Tag>
                  <Tag color="processing">{selectedOrganization.status}</Tag>
                  {currentOrg?.is_owner ? <Tag color="gold">Owner</Tag> : null}
                </>
              ) : null}
            </Space>

            <Title style={{ ...titleStyle, marginTop: 16 }}>
              {selectedOrganization?.display_name || t('detail.fallbackName')}
            </Title>
            <Paragraph style={{ ...subtitleStyle, marginBottom: 0, maxWidth: 760 }}>
              {selectedOrganization?.description || t('detail.description')}
            </Paragraph>
          </div>

          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => void handleRefresh()}>
              {t('detail.refresh')}
            </Button>
            {canManage ? (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setInviteModalOpen(true)}
                disabled={!canInvite}
              >
                {t('detail.inviteMember')}
              </Button>
            ) : null}
            {canDelete ? (
              <Button danger icon={<DeleteOutlined />} onClick={handleDeleteOrganization}>
                {t('detail.deleteOrg')}
              </Button>
            ) : null}
          </Space>
        </div>
      </div>

      {pageLoading ? (
        <Card style={tableCardStyle} loading />
      ) : selectedOrganization ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Card style={tableCardStyle}>
            <Descriptions
              column={{ xs: 1, md: 2, xl: 4 }}
              items={[
                {
                  key: 'org-name',
                  label: t('detail.uniqueId'),
                  children: selectedOrganization.name,
                },
                {
                  key: 'my-role',
                  label: t('detail.currentRole'),
                  children: currentOrg ? (
                    <RoleBadge role={currentOrg.role} isOwner={currentOrg.is_owner} />
                  ) : (
                    '-'
                  ),
                },
                {
                  key: 'created-at',
                  label: t('detail.createdAt'),
                  children: dayjs(selectedOrganization.created_at).format('YYYY-MM-DD HH:mm'),
                },
                {
                  key: 'owner-id',
                  label: t('detail.ownerId'),
                  children: selectedOrganization.owner_id,
                },
                {
                  key: 'member-total',
                  label: t('detail.memberCount'),
                  children: membersMeta?.total ?? members.length,
                },
                {
                  key: 'quota-members',
                  label: t('detail.remainingSeats'),
                  children: quota ? quota.members.remaining : '-',
                },
                {
                  key: 'quota-executions',
                  label: t('detail.remainingExecs'),
                  children: quota ? quota.executions.remaining : '-',
                },
                {
                  key: 'quota-storage',
                  label: t('detail.remainingStorage'),
                  children: quota ? `${quota.storage.remaining} GB` : '-',
                },
              ]}
            />

            {isPersonalOrg ? (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  borderRadius: 14,
                  background: isDark ? 'rgba(22,119,255,0.12)' : 'rgba(22,119,255,0.06)',
                }}
              >
                <Text>{t('detail.personalLocked')}</Text>
              </div>
            ) : null}
          </Card>

          <Tabs defaultActiveKey="overview" items={tabItems} />
        </Space>
      ) : (
        <Card style={tableCardStyle}>
          <Empty description={t('detail.notFound')} />
        </Card>
      )}

      {id ? (
        <InviteMemberModal
          open={inviteModalOpen}
          organizationId={id}
          onClose={() => setInviteModalOpen(false)}
          onSuccess={() => {
            if (id) {
              void fetchInvitations(id);
            }
          }}
        />
      ) : null}
    </div>
  );
}

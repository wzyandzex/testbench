import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  message,
  Popconfirm,
  Card,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  LockOutlined,
  UnlockOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores';
import { authService } from '@/services/auth';
import type { User } from '@/types/api/auth';
import type { UserStatus, UserRole } from '@/types/api/auth';
import { usersPageStyle } from './style';

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

const STATUS_COLORS: Record<UserStatus, string> = {
  active: 'success',
  inactive: 'default',
  locked: 'error',
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'red',
  user: 'blue',
  viewer: 'default',
};

const useColumns = (
  t: (key: string) => string,
  onLock: (user: User) => void,
  onUnlock: (user: User) => void,
  onEditRole: (user: User) => void,
  onDelete: (user: User) => void
) =>
  useMemo(
    () => [
      {
        title: t('columns.user'),
        dataIndex: 'username',
        key: 'username',
        width: 200,
        render: (username: string, record: User) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {record.avatar ? (
              <img
                src={record.avatar}
                alt={username}
                style={{ width: 32, height: 32, borderRadius: '50%' }}
              />
            ) : (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UserOutlined style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.45)' }} />
              </div>
            )}
            <div>
              <div style={{ fontWeight: 500 }}>{username}</div>
              <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.45)' }}>{record.email}</div>
            </div>
          </div>
        ),
      },
      {
        title: t('columns.role'),
        dataIndex: 'role',
        key: 'role',
        width: 100,
        render: (role: UserRole) => (
          <Tag color={ROLE_COLORS[role]}>{t(`role.${role}`)}</Tag>
        ),
      },
      {
        title: t('columns.status'),
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (status: UserStatus) => (
          <Tag color={STATUS_COLORS[status]}>{t(`status.${status}`)}</Tag>
        ),
      },
      {
        title: t('columns.registeredAt'),
        dataIndex: 'created_at',
        key: 'created_at',
        width: 180,
        render: (date: string) => new Date(date).toLocaleString(),
      },
      {
        title: t('columns.actions'),
        key: 'actions',
        width: 200,
        fixed: 'right' as const,
        render: (_: unknown, record: User) => (
          <Space size="small">
            {record.status === 'locked' ? (
              <Tooltip title={t('actions.unlock')}>
                <Button
                  type="text"
                  icon={<UnlockOutlined />}
                  onClick={() => onUnlock(record)}
                />
              </Tooltip>
            ) : (
              <Tooltip title={t('actions.lock')}>
                <Button
                  type="text"
                  icon={<LockOutlined />}
                  onClick={() => onLock(record)}
                />
              </Tooltip>
            )}
            <Tooltip title={t('actions.editRole')}>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEditRole(record)}
              />
            </Tooltip>
            <Popconfirm
              title={t('actions.confirmDelete')}
              description={t('actions.deleteWarning')}
              onConfirm={() => onDelete(record)}
              okText={t('actions.confirm')}
              cancelText={t('actions.cancel')}
              okButtonProps={{ danger: true }}
            >
              <Tooltip title={t('actions.deleteUser')}>
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [t, onLock, onUnlock, onEditRole, onDelete]
  );

export default function UsersPage() {
  const { t } = useTranslation('admin');
  const currentUser = useAuthStore((s) => s.user);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | null>(null);
  const [roleFilter, setRoleFilter] = useState<UserRole | null>(null);

  const [lockModalVisible, setLockModalVisible] = useState(false);
  const [lockUser, setLockUser] = useState<User | null>(null);
  const [lockForm] = Form.useForm();

  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [roleUser, setRoleUser] = useState<User | null>(null);
  const [roleForm] = Form.useForm();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await authService.getUsers({
        page,
        page_size: pageSize,
        status: statusFilter ?? undefined,
        role: roleFilter ?? undefined,
        search: searchKeyword || undefined,
      });
      setUsers(result.items);
      setTotal(result.total);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, roleFilter, searchKeyword]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = useCallback((value: string) => {
    setSearchKeyword(value);
    setPage(1);
  }, []);

  const handleStatusFilterChange = useCallback((value: UserStatus | null) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const handleRoleFilterChange = useCallback((value: UserRole | null) => {
    setRoleFilter(value);
    setPage(1);
  }, []);

  const handleLockClick = useCallback((user: User) => {
    setLockUser(user);
    setLockModalVisible(true);
  }, []);

  const handleLockConfirm = useCallback(async () => {
    if (!lockUser) return;
    try {
      const values = await lockForm.validateFields();
      await authService.lockUser(lockUser.id, {
        reason: values.reason,
        duration_hours: values.duration_hours || undefined,
      });
      message.success(t('messages.locked'));
      setLockModalVisible(false);
      lockForm.resetFields();
      setLockUser(null);
      fetchUsers();
    } catch {
      // handled by interceptor
    }
  }, [lockUser, lockForm, fetchUsers, t]);

  const handleUnlock = useCallback(
    async (user: User) => {
      try {
        await authService.unlockUser(user.id);
        message.success(t('messages.unlocked'));
        fetchUsers();
      } catch {
        // handled by interceptor
      }
    },
    [fetchUsers, t]
  );

  const handleEditRoleClick = useCallback((user: User) => {
    setRoleUser(user);
    roleForm.setFieldsValue({ role: user.role });
    setRoleModalVisible(true);
  }, [roleForm]);

  const handleRoleChange = useCallback(async () => {
    if (!roleUser) return;
    try {
      const values = await roleForm.validateFields();
      await authService.updateUserRole(roleUser.id, { role: values.role });
      message.success(t('messages.roleUpdated'));
      setRoleModalVisible(false);
      setRoleUser(null);
      fetchUsers();
    } catch {
      // handled by interceptor
    }
  }, [roleUser, roleForm, fetchUsers, t]);

  const handleDelete = useCallback(
    async (user: User) => {
      if (user.id === currentUser?.id) {
        message.error(t('messages.cannotDeleteSelf'));
        return;
      }
      try {
        await authService.deleteUser(user.id);
        message.success(t('messages.deleted'));
        fetchUsers();
      } catch {
        // handled by interceptor
      }
    },
    [fetchUsers, currentUser, t]
  );

  const columns = useColumns(t, handleLockClick, handleUnlock, handleEditRoleClick, handleDelete);

  return (
    <div style={usersPageStyle.container}>
      <div style={usersPageStyle.header}>
        <div>
          <h1 style={usersPageStyle.title}>{t('title')}</h1>
          <p style={usersPageStyle.description}>{t('description')}</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchUsers} loading={loading}>
          {t('common:actions.refresh')}
        </Button>
      </div>

      <Card style={usersPageStyle.filterCard}>
        <Space size="middle" wrap>
          <Search
            placeholder={t('filter.searchPlaceholder')}
            allowClear
            style={{ width: 240 }}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
          />
          <Select
            placeholder={t('filter.statusPlaceholder')}
            allowClear
            style={{ width: 140 }}
            value={statusFilter}
            onChange={handleStatusFilterChange}
          >
            <Option value="active">{t('status.active')}</Option>
            <Option value="inactive">{t('status.inactive')}</Option>
            <Option value="locked">{t('status.locked')}</Option>
          </Select>
          <Select
            placeholder={t('filter.rolePlaceholder')}
            allowClear
            style={{ width: 140 }}
            value={roleFilter}
            onChange={handleRoleFilterChange}
          >
            <Option value="admin">{t('role.admin')}</Option>
            <Option value="user">{t('role.user')}</Option>
            <Option value="viewer">{t('role.viewer')}</Option>
          </Select>
        </Space>
      </Card>

      <Card style={usersPageStyle.tableCard}>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (tot) => t('pagination.total', { total: tot }),
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps || 10);
            },
          }}
        />
      </Card>

      <Modal
        title={t('lockModal.title')}
        open={lockModalVisible}
        onCancel={() => {
          setLockModalVisible(false);
          lockForm.resetFields();
          setLockUser(null);
        }}
        onOk={handleLockConfirm}
        okText={t('lockModal.confirmLock')}
        cancelText={t('lockModal.cancel')}
      >
        <Form form={lockForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="reason"
            label={t('lockModal.reasonLabel')}
            rules={[{ required: true, message: t('lockModal.reasonRequired') }]}
          >
            <TextArea
              placeholder={t('lockModal.reasonPlaceholder')}
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>
          <Form.Item name="duration_hours" label={t('lockModal.durationLabel')} extra={t('lockModal.durationExtra')}>
            <Input type="number" placeholder={t('lockModal.durationPlaceholder')} min={1} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('roleModal.title')}
        open={roleModalVisible}
        onCancel={() => {
          setRoleModalVisible(false);
          setRoleUser(null);
        }}
        onOk={handleRoleChange}
        okText={t('roleModal.confirmChange')}
        cancelText={t('roleModal.cancel')}
      >
        <Form form={roleForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="role"
            label={t('roleModal.newRoleLabel')}
            rules={[{ required: true, message: t('roleModal.roleRequired') }]}
          >
            <Select placeholder={t('roleModal.rolePlaceholder')}>
              <Option value="admin">{t('role.admin')}</Option>
              <Option value="user">{t('role.user')}</Option>
              <Option value="viewer">{t('role.viewer')}</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

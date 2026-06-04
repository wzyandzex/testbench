import { useCallback, useEffect, useState } from 'react';
import { Avatar, Button, Input, List, message, Popconfirm, Space, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import type { CommentInfo } from '../service';
import { createComment, deleteComment, listComments, updateComment } from '../service';
import { useAuthStore } from '@/stores/authStore';

dayjs.extend(relativeTime);

const { TextArea } = Input;
const { Text } = Typography;

interface CommentSectionProps {
  shareId: string;
  canComment: boolean;
}

export function CommentSection({ shareId, canComment }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [page, setPage] = useState(1);

  const currentUser = useAuthStore((s) => s.user);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await listComments(shareId, { page, page_size: 20 });
      setComments(resp.data || []);
      setTotal(resp.total);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [shareId, page]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await createComment(shareId, newComment.trim());
      setNewComment('');
      message.success('评论已发送');
      fetchComments();
    } catch {
      // handled by interceptor
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      await updateComment(shareId, commentId, editContent.trim());
      setEditingId(null);
      setEditContent('');
      message.success('评论已更新');
      fetchComments();
    } catch {
      // handled by interceptor
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(shareId, commentId);
      message.success('评论已删除');
      fetchComments();
    } catch {
      // handled by interceptor
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      <Text strong style={{ fontSize: 16 }}>
        评论 ({total})
      </Text>

      {canComment && (
        <div style={{ marginTop: 16, marginBottom: 16 }}>
          <TextArea
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="写下你的评论..."
            maxLength={2000}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={submitting}
            onClick={handleSubmit}
            disabled={!newComment.trim()}
            style={{ marginTop: 8 }}
          >
            发送
          </Button>
        </div>
      )}

      <List
        loading={loading}
        dataSource={comments}
        pagination={
          total > 20
            ? {
                current: page,
                pageSize: 20,
                total,
                onChange: setPage,
                size: 'small',
              }
            : false
        }
        renderItem={(item) => (
          <List.Item
            actions={
              currentUser?.id === item.user_id
                ? [
                    <Button
                      key="edit"
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setEditingId(item.id);
                        setEditContent(item.content);
                      }}
                    />,
                    <Popconfirm
                      key="delete"
                      title="确定删除这条评论？"
                      onConfirm={() => handleDelete(item.id)}
                    >
                      <Button type="text" size="small" icon={<DeleteOutlined />} danger />
                    </Popconfirm>,
                  ]
                : undefined
            }
          >
            <List.Item.Meta
              avatar={<Avatar src={item.avatar}>{item.username?.[0]}</Avatar>}
              title={
                <Space>
                  <Text strong>{item.username}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(item.created_at).fromNow()}
                  </Text>
                </Space>
              }
              description={
                editingId === item.id ? (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <TextArea
                      rows={2}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      maxLength={2000}
                    />
                    <Space>
                      <Button size="small" type="primary" onClick={() => handleEdit(item.id)}>
                        保存
                      </Button>
                      <Button size="small" onClick={() => setEditingId(null)}>
                        取消
                      </Button>
                    </Space>
                  </Space>
                ) : (
                  <Text>{item.content}</Text>
                )
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
}

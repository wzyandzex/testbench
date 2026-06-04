import api from '@/services/api';

// Types
export type ShareType = 'link' | 'file';
export type AccessLevel = 'view' | 'comment' | 'manage';
export type ShareScope = 'user' | 'org' | 'external';
export type ShareStatus = 'active' | 'revoked' | 'expired';

export interface ShareInfo {
  id: string;
  org_id: string;
  execution_id: string;
  execution_name?: string;
  shared_by: string;
  shared_by_name?: string;
  share_type: ShareType;
  access_level: AccessLevel;
  scope: ShareScope;
  recipient_user_id?: string;
  recipient_name?: string;
  token?: string;
  share_url?: string;
  file_path?: string;
  file_format?: string;
  file_url?: string;
  expires_at?: string;
  status: ShareStatus;
  view_count: number;
  has_password: boolean;
  created_at: string;
}

export interface CommentInfo {
  id: string;
  share_id: string;
  user_id: string;
  username: string;
  avatar: string;
  parent_id?: string;
  content: string;
  replies?: CommentInfo[];
  created_at: string;
  updated_at: string;
}

export interface CreateShareRequest {
  execution_id: string;
  share_type: ShareType;
  access_level: AccessLevel;
  scope: ShareScope;
  recipient_user_id?: string;
  password?: string;
  file_format?: string;
  expires_at?: string;
}

export interface UpdateShareRequest {
  access_level?: AccessLevel;
  expires_at?: string;
  password?: string;
}

export interface ShareListResponse {
  total: number;
  page: number;
  size: number;
  data: ShareInfo[];
}

export interface CommentListResponse {
  total: number;
  page: number;
  size: number;
  data: CommentInfo[];
}

// API calls
export async function createShare(req: CreateShareRequest): Promise<ShareInfo> {
  return api.post('/shares', req);
}

export async function listShares(params: {
  tab?: 'sent' | 'received';
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<ShareListResponse> {
  return api.get('/shares', { params });
}

export async function getShare(id: string): Promise<ShareInfo> {
  return api.get(`/shares/${id}`);
}

export async function updateShare(id: string, req: UpdateShareRequest): Promise<ShareInfo> {
  return api.put(`/shares/${id}`, req);
}

export async function revokeShare(id: string): Promise<void> {
  return api.delete(`/shares/${id}`);
}

export async function listExecutionShares(executionId: string): Promise<ShareInfo[]> {
  return api.get(`/executions/${executionId}/shares`);
}

export async function listComments(shareId: string, params?: {
  page?: number;
  page_size?: number;
}): Promise<CommentListResponse> {
  return api.get(`/shares/${shareId}/comments`, { params });
}

export async function createComment(shareId: string, content: string, parentId?: string): Promise<CommentInfo> {
  return api.post(`/shares/${shareId}/comments`, { content, parent_id: parentId });
}

export async function updateComment(shareId: string, commentId: string, content: string): Promise<CommentInfo> {
  return api.put(`/shares/${shareId}/comments/${commentId}`, { content });
}

export async function deleteComment(shareId: string, commentId: string): Promise<void> {
  return api.delete(`/shares/${shareId}/comments/${commentId}`);
}

// Public share (no auth)
export async function getPublicShare(token: string): Promise<{
  share: ShareInfo;
  has_password: boolean;
}> {
  return api.get(`/public/shares/${token}`);
}

export async function verifyPublicSharePassword(token: string, password: string): Promise<ShareInfo> {
  return api.post(`/public/shares/${token}/verify`, { password });
}

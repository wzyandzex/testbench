/**
 * API 统一响应格式
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  request_id?: string;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  total: number;
  page: number;
  size: number;
  data: T[];
}

/**
 * 列表查询参数
 */
export interface ListParams {
  page?: number;
  page_size?: number;
  sort_by?: string;
  order?: 'asc' | 'desc';
  [key: string]: any;
}

/**
 * 错误响应
 */
export interface ErrorResponse {
  code: number;
  message: string;
  details?: string;
  request_id?: string;
}

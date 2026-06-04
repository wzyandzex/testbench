export default {
  // 通用错误
  unauthorized: '未授权，请先登录',
  forbidden: '没有权限访问',
  notFound: '请求的资源不存在',
  serverError: '服务器错误，请稍后重试',
  networkError: '网络错误，请检查网络连接',
  timeout: '请求超时，请重试',

  // 认证错误
  loginFailed: '登录失败',
  invalidCredentials: '用户名或密码错误',
  tokenExpired: '登录已过期，请重新登录',
  userExists: '用户名已存在',
  emailExists: '邮箱已被使用',

  // 操作错误
  deleteFailed: '删除失败',
  updateFailed: '更新失败',
  createFailed: '创建失败',
  uploadFailed: '上传失败',

  // 表单错误
  required: '此字段为必填项',
  invalidFormat: '格式不正确',
  tooShort: '长度太短',
  tooLong: '长度太长',
};

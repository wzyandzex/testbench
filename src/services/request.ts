import api from './api';

export interface RequestConfig {
  // 是否显示错误消息
  showError?: boolean;
  // 是否显示加载状态
  loading?: boolean;
  // 请求取消标识
  cancelKey?: string;
}

// 取消令牌存储
const cancelTokens = new Map<string, AbortController>();

export const request = {
  get: <T = any>(url: string, config?: any): Promise<T> => {
    return api.get(url, config);
  },

  post: <T = any>(url: string, data?: any, config?: any): Promise<T> => {
    return api.post(url, data, config);
  },

  put: <T = any>(url: string, data?: any, config?: any): Promise<T> => {
    return api.put(url, data, config);
  },

  delete: <T = any>(url: string, config?: any): Promise<T> => {
    return api.delete(url, config);
  },

  patch: <T = any>(url: string, data?: any, config?: any): Promise<T> => {
    return api.patch(url, data, config);
  },

  // 文件上传
  upload: <T = any>(
    url: string,
    file: File | FormData,
    onProgress?: (progress: number) => void
  ): Promise<T> => {
    const formData = file instanceof FormData ? file : new FormData();
    if (file instanceof File) {
      formData.append('file', file);
    }

    return api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },

  // 文件下载
  download: (url: string, filename?: string): Promise<void> => {
    return api.get(url, {
      responseType: 'blob' as any,
    }).then((data: any) => {
      const blobUrl = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    });
  },
};

// 取消请求
export function cancelRequest(key: string) {
  const controller = cancelTokens.get(key);
  if (controller) {
    controller.abort();
    cancelTokens.delete(key);
  }
}

// 取消所有请求
export function cancelAllRequests() {
  cancelTokens.forEach((controller) => controller.abort());
  cancelTokens.clear();
}

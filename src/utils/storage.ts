import { STORAGE_KEYS } from '@/constants';

/**
 * LocalStorage 工具
 */
export const storage = {
  /**
   * 获取数据
   */
  get<T = any>(key: string): T | null {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return null;
      return JSON.parse(value);
    } catch {
      return null;
    }
  },

  /**
   * 设置数据
   */
  set(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to set localStorage:', error);
    }
  },

  /**
   * 删除数据
   */
  remove(key: string): void {
    localStorage.removeItem(key);
  },

  /**
   * 清空所有数据
   */
  clear(): void {
    localStorage.clear();
  },

  /**
   * 获取 Token
   */
  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  /**
   * 设置 Token
   */
  setToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  /**
   * 清除 Token
   */
  clearToken(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },
};

/**
 * SessionStorage 工具
 */
export const sessionStorage = {
  get<T = any>(key: string): T | null {
    try {
      const value = window.sessionStorage.getItem(key);
      if (value === null) return null;
      return JSON.parse(value);
    } catch {
      return null;
    }
  },

  set(key: string, value: any): void {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to set sessionStorage:', error);
    }
  },

  remove(key: string): void {
    window.sessionStorage.removeItem(key);
  },

  clear(): void {
    window.sessionStorage.clear();
  },
};

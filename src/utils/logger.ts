/**
 * 统一的日志工具
 * 替代 console.log，便于后续统一管理和调试
 */

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

class Logger {
  private isDevelopment = import.meta.env.MODE === 'development';

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  debug(message: string, ..._args: unknown[]): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message), ..._args);
    }
  }

  info(message: string, ..._args: unknown[]): void {
    if (this.isDevelopment) {
      console.info(this.formatMessage(LogLevel.INFO, message), ..._args);
    }
  }

  warn(message: string, ..._args: unknown[]): void {
    if (this.isDevelopment) {
      console.warn(this.formatMessage(LogLevel.WARN, message), ..._args);
    }
  }

  error(message: string, error?: Error | unknown, ..._args: unknown[]): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(this.formatMessage(LogLevel.ERROR, message), errorMessage, ..._args);
    // 在开发环境下打印完整错误堆栈
    if (this.isDevelopment && error instanceof Error) {
      console.error(error.stack);
    }
  }

  /**
   * 记录 API 请求
   */
  apiRequest(method: string, url: string, data?: unknown): void {
    this.debug(`API Request: ${method.toUpperCase()} ${url}`, data);
  }

  /**
   * 记录 API 响应
   */
  apiResponse(method: string, url: string, data?: unknown): void {
    this.debug(`API Response: ${method.toUpperCase()} ${url}`, data);
  }

  /**
   * 记录 API 错误
   */
  apiError(method: string, url: string, error?: Error | unknown): void {
    this.error(`API Error: ${method.toUpperCase()} ${url}`, error);
  }

  /**
   * 记录用户操作
   */
  userAction(action: string, details?: Record<string, unknown>): void {
    this.info(`User Action: ${action}`, details);
  }

  /**
   * 记录性能指标
   */
  performance(metric: string, value: number, unit = 'ms'): void {
    this.debug(`Performance: ${metric} = ${value}${unit}`);
  }
}

// 单例导出
export const logger = new Logger();

export default logger;

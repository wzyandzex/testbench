import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';

dayjs.extend(relativeTime);

/**
 * 格式化日期时间
 */
export function formatDateTime(date: string | Date, format = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs(date).format(format);
}

/**
 * 格式化日期
 */
export function formatDate(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD');
}

/**
 * 格式化时间
 */
export function formatTime(date: string | Date): string {
  return dayjs(date).format('HH:mm:ss');
}

/**
 * 相对时间
 */
export function formatRelativeTime(date: string | Date, locale = 'zh-cn'): string {
  dayjs.locale(locale);
  return dayjs(date).fromNow();
}

/**
 * 格式化文件大小
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 格式化数字
 */
export function formatNumber(num: number, locale = 'zh-CN'): string {
  return num.toLocaleString(locale);
}

/**
 * 格式化百分比
 */
export function formatPercent(value: number, decimals = 1): string {
  return (value * 100).toFixed(decimals) + '%';
}

/**
 * 格式化货币
 */
export function formatCurrency(amount: number, currency = 'CNY', locale = 'zh-CN'): string {
  return amount.toLocaleString(locale, {
    style: 'currency',
    currency,
  });
}

/**
 * 截断文本
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * 高亮搜索关键词
 */
export function highlightKeyword(text: string, keyword: string): string {
  if (!keyword) return text;
  const regex = new RegExp(`(${keyword})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

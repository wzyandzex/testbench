import { notificationService } from '@/services/notification';
import type {
  DeadLetterListParams,
  HistoryExportFormat,
  NotificationAcknowledgeRequest,
  NotificationBulkAcknowledgeRequest,
  NotificationListParams,
} from '@/types/notification';

export const notificationPageService = {
  getList(params?: NotificationListParams) {
    return notificationService.getList(params);
  },

  getPendingCount() {
    return notificationService.getPendingCount();
  },

  getStats() {
    return notificationService.getStats();
  },

  getDetail(id: string) {
    return notificationService.getDetail(id);
  },

  acknowledge(id: string, payload?: NotificationAcknowledgeRequest) {
    return notificationService.acknowledge(id, payload);
  },

  reject(id: string, payload?: NotificationAcknowledgeRequest) {
    return notificationService.reject(id, payload);
  },

  bulkAcknowledge(payload: NotificationBulkAcknowledgeRequest) {
    return notificationService.bulkAcknowledge(payload);
  },

  exportHistory(format: HistoryExportFormat, params?: NotificationListParams) {
    return notificationService.export({
      ...params,
      format,
    });
  },

  getDLQList(params?: DeadLetterListParams) {
    return notificationService.getDLQList(params);
  },

  getDLQCount() {
    return notificationService.getDLQCount();
  },

  getDLQDetail(id: string) {
    return notificationService.getDLQDetail(id);
  },

  replayDLQ(id: string) {
    return notificationService.replayDLQ(id);
  },

  removeDLQ(id: string) {
    return notificationService.removeDLQ(id);
  },
};

export default notificationPageService;


/**
 * Analyzer API 服务
 * Slice: S20
 */

import api from './api';
import type { ReportListResponse } from '@/types/api/analyzer';

export const analyzerService = {
  listReports: (params?: {
    page?: number; page_size?: number; report_type?: string;
    start_date?: string; end_date?: string;
  }) => {
    return api.get<ReportListResponse>('/analyzer/reports', { params });
  },

  getReport: (id: string) => {
    return api.get(`/analyzer/reports/${id}`);
  },

  listTrends: (params?: {
    page?: number; page_size?: number;
    start_date?: string; end_date?: string;
  }) => {
    return api.get<ReportListResponse>('/analyzer/trends', { params });
  },

  listComparisons: (params?: {
    page?: number; page_size?: number;
    start_date?: string; end_date?: string;
  }) => {
    return api.get<ReportListResponse>('/analyzer/comparisons', { params });
  },
};

export interface Execution {
  id: string;
  taskName: string;
  taskId: string;
  agent: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  score?: number;
  duration?: number;
  startTime: Date;
  endTime?: Date;
  logs?: ExecutionLog[];
}

export interface ExecutionLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  data?: any;
}

export interface ExecutionFilters {
  search?: string;
  status?: string[];
  agent?: string[];
  taskId?: string[];
  dateRange?: [Date, Date];
  page?: number;
  pageSize?: number;
}

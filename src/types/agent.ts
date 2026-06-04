export interface Agent {
  id: string;
  name: string;
  description?: string;
  type: 'openai' | 'anthropic' | 'google' | 'custom';
  model: string;
  apiKey: string;
  baseUrl?: string;
  status: 'active' | 'inactive';
  totalExecutions: number;
  avgScore: number;
  createdAt: Date;
  updatedAt: Date;
  lastExecution?: Date;
  config: {
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
    [key: string]: any;
  };
}

export interface AgentFilters {
  search?: string;
  type?: string[];
  status?: string[];
  page?: number;
  pageSize?: number;
}

export interface AgentFormData {
  name: string;
  description?: string;
  type: 'openai' | 'anthropic' | 'google' | 'custom';
  model: string;
  apiKey: string;
  baseUrl?: string;
  status: 'active' | 'inactive';
  config: {
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
  };
}

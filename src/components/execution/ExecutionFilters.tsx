import { Input, Select, Button, Space, Row, Col, DatePicker } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useCardStyle } from '@/theme';
import type { ExecutionFilters as Filters } from '@/types/execution';

const { Search } = Input;
const { RangePicker } = DatePicker;

interface ExecutionFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onRefresh: () => void;
}

export function ExecutionFilters({ filters, onFiltersChange, onRefresh }: ExecutionFiltersProps) {
  const { t } = useTranslation('executions');
  const containerStyle = useCardStyle();

  const handleSearch = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleStatusChange = (value: string[]) => {
    onFiltersChange({ ...filters, status: value });
  };

  const handleAgentChange = (value: string[]) => {
    onFiltersChange({ ...filters, agent: value });
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      onFiltersChange({
        ...filters,
        dateRange: [dates[0].toDate(), dates[1].toDate()],
      });
    } else {
      onFiltersChange({ ...filters, dateRange: undefined });
    }
  };

  return (
    <div style={{ ...containerStyle, padding: 20, marginBottom: 20 }}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={12} md={6}>
          <Search
            placeholder={t('components.filters.searchPlaceholder')}
            allowClear
            prefix={<SearchOutlined />}
            onSearch={handleSearch}
            onChange={(e) => !e.target.value && onFiltersChange({ ...filters, search: '' })}
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Select
            mode="multiple"
            placeholder={t('components.filters.statusPlaceholder')}
            allowClear
            value={filters.status}
            onChange={handleStatusChange}
            options={[
              { label: t('status.pending'), value: 'pending' },
              { label: t('status.running'), value: 'running' },
              { label: t('status.completed'), value: 'completed' },
              { label: t('status.failed'), value: 'failed' },
              { label: t('status.cancelled'), value: 'cancelled' },
            ]}
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Select
            mode="multiple"
            placeholder={t('components.filters.agentPlaceholder')}
            allowClear
            value={filters.agent}
            onChange={handleAgentChange}
            options={[
              { label: 'GPT-4 Agent', value: 'gpt-4' },
              { label: 'Claude Agent', value: 'claude' },
              { label: 'Gemini Agent', value: 'gemini' },
            ]}
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <RangePicker
            placeholder={[t('components.filters.startTime'), t('components.filters.endTime')]}
            onChange={handleDateRangeChange}
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button icon={<ReloadOutlined />} onClick={onRefresh}>
              {t('components.filters.refresh')}
            </Button>
          </Space>
        </Col>
      </Row>
    </div>
  );
}

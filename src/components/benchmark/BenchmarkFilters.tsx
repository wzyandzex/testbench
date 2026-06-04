import { Input, Select, Button, Space, Row, Col } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useFilterBarStyle } from '@/theme';
import type { BenchmarkFilters as Filters } from '@/types/benchmark';

const { Search } = Input;

export interface BenchmarkFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onRefresh: () => void;
}

export function BenchmarkFilters({ filters, onFiltersChange, onRefresh }: BenchmarkFiltersProps) {
  const { t } = useTranslation('benchmarks');
  const filterBarStyle = useFilterBarStyle();

  const handleSearch = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleStatusChange = (value: string[]) => {
    onFiltersChange({ ...filters, status: value });
  };

  const handleCategoryChange = (value: string[]) => {
    onFiltersChange({ ...filters, category: value });
  };

  const handleLanguageChange = (value: string[]) => {
    onFiltersChange({ ...filters, language: value });
  };

  return (
    <div style={filterBarStyle}>
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
        <Col xs={24} sm={12} md={5}>
          <Select
            mode="tags"
            placeholder={t('components.filters.statusPlaceholder')}
            allowClear
            value={filters.status}
            onChange={handleStatusChange}
            options={[
              { label: t('components.filters.statusActive'), value: 'active' },
              { label: t('components.filters.statusDraft'), value: 'draft' },
              { label: t('components.filters.statusArchived'), value: 'archived' },
            ]}
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={24} sm={12} md={5}>
          <Select
            mode="multiple"
            placeholder={t('components.filters.categoryPlaceholder')}
            allowClear
            value={filters.category}
            onChange={handleCategoryChange}
            options={[
              { label: t('components.filters.categoryCoding'), value: 'coding' },
              { label: t('components.filters.categoryReasoning'), value: 'reasoning' },
              { label: t('components.filters.categoryKnowledge'), value: 'knowledge' },
            ]}
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={24} sm={12} md={5}>
          <Select
            mode="multiple"
            placeholder={t('components.filters.languagePlaceholder')}
            allowClear
            value={filters.language}
            onChange={handleLanguageChange}
            options={[
              { label: 'Python', value: 'python' },
              { label: 'JavaScript', value: 'javascript' },
              { label: 'TypeScript', value: 'typescript' },
              { label: 'Java', value: 'java' },
              { label: 'Go', value: 'go' },
              { label: 'Rust', value: 'rust' },
              { label: 'C++', value: 'cpp' },
            ]}
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={24} sm={12} md={3}>
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

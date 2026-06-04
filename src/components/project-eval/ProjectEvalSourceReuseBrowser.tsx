import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Pagination,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import {
  formatDateTime,
  getProjectTypeLabel,
  getSourceIndexLastUpdated,
  getSourceIndexSummary,
  getSourceIndexTone,
  ZIP_SOURCE_REUSE_SUMMARY_TEXT_KEY,
} from '@/components/project-eval/helpers';
import { projectEvalService } from '@/services/project-eval';
import type {
  ProjectEvalSourceListItem,
  ProjectEvalSourceListParams,
  ProjectEvalSourceListResponse,
  ProjectType,
  SourceType,
} from '@/types/api/project-eval';

const { Paragraph, Text } = Typography;
const PAGE_SIZE = 6;

interface SourceReuseBrowserProps {
  availableProjectTypes: ProjectType[];
  onSelectSource: (source: ProjectEvalSourceListItem) => void;
}

interface BrowserFilters {
  name: string;
  sourceType?: SourceType;
  detectedType?: ProjectType;
  createdBy: string;
}

function createDefaultFilters(): BrowserFilters {
  return { name: '', sourceType: undefined, detectedType: undefined, createdBy: '' };
}

function normalizeFilters(filters: BrowserFilters): BrowserFilters {
  return {
    name: filters.name.trim(),
    sourceType: filters.sourceType,
    detectedType: filters.detectedType,
    createdBy: filters.createdBy.trim(),
  };
}

function getSourceTypeLabel(value?: SourceType): string {
  return value === 'zip'
    ? i18next.t('projectEval:sourceReuse.sourceTypes.zip')
    : i18next.t('projectEval:sourceReuse.sourceTypes.git');
}

function getSourceSummary(source: ProjectEvalSourceListItem): string {
  if (source.source_type === 'git') {
    const details = [
      source.git_url,
      source.branch ? i18next.t('projectEval:sourceReuse.branchPrefix', { branch: source.branch }) : undefined,
      source.commit_sha
        ? i18next.t('projectEval:sourceReuse.commitPrefix', { commit: source.commit_sha.slice(0, 12) })
        : undefined,
    ].filter(Boolean);
    return details.length > 0
      ? details.join(' | ')
      : i18next.t('projectEval:sourceReuse.noMetadata');
  }

  return i18next.t(ZIP_SOURCE_REUSE_SUMMARY_TEXT_KEY);
}

export default function ProjectEvalSourceReuseBrowser({
  availableProjectTypes,
  onSelectSource,
}: SourceReuseBrowserProps) {
  const { t } = useTranslation('projectEval');
  const [filters, setFilters] = useState<BrowserFilters>(() => createDefaultFilters());
  const [appliedFilters, setAppliedFilters] = useState<BrowserFilters>(() => createDefaultFilters());
  const [items, setItems] = useState<ProjectEvalSourceListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectedTypeOptions = useMemo<ProjectType[]>(() => {
    return Array.from(new Set<ProjectType>([...availableProjectTypes, 'unknown']));
  }, [availableProjectTypes]);

  const query = useMemo<ProjectEvalSourceListParams>(() => {
    return {
      page,
      page_size: PAGE_SIZE,
      name: appliedFilters.name || undefined,
      source_type: appliedFilters.sourceType,
      detected_type: appliedFilters.detectedType,
      created_by: appliedFilters.createdBy || undefined,
      order_by: 'updated_at',
      order_dir: 'desc',
    };
  }, [appliedFilters, page]);

  const fetchSources = useCallback(async (params: ProjectEvalSourceListParams) => {
    setLoading(true);
    try {
      const response = await projectEvalService.listSources(params, { silentError: true });
      const payload = response as unknown as ProjectEvalSourceListResponse;
      setItems(Array.isArray(payload.items) ? payload.items : []);
      setTotal(typeof payload.total === 'number' ? payload.total : 0);
      setError(null);
    } catch (fetchError: unknown) {
      const response = (fetchError as { response?: { data?: { message?: string } } })?.response;
      setItems([]);
      setTotal(0);
      setError(response?.data?.message || t('sourceReuse.loadErrorDefault'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchSources(query);
  }, [fetchSources, query]);

  const handleApplyFilters = useCallback(() => {
    setPage(1);
    setAppliedFilters(normalizeFilters(filters));
  }, [filters]);

  const handleResetFilters = useCallback(() => {
    const nextFilters = createDefaultFilters();
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setPage(1);
    setError(null);
  }, []);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Text strong>{t('sourceReuse.filters.nameSearch')}</Text>
          <Input
            placeholder={t('sourceReuse.filters.namePlaceholder')}
            value={filters.name}
            onChange={(event) => setFilters((current) => ({ ...current, name: event.target.value }))}
            onPressEnter={handleApplyFilters}
            style={{ marginTop: 8 }}
          />
        </Col>
        <Col xs={24} md={12}>
          <Text strong>{t('sourceReuse.filters.creator')}</Text>
          <Input
            placeholder={t('sourceReuse.filters.creatorPlaceholder')}
            value={filters.createdBy}
            onChange={(event) => setFilters((current) => ({ ...current, createdBy: event.target.value }))}
            onPressEnter={handleApplyFilters}
            style={{ marginTop: 8 }}
          />
        </Col>
        <Col xs={24} md={12}>
          <Text strong>{t('sourceReuse.filters.sourceType')}</Text>
          <Select
            allowClear
            value={filters.sourceType}
            placeholder={t('sourceReuse.filters.sourceTypePlaceholder')}
            style={{ width: '100%', marginTop: 8 }}
            options={[
              { value: 'git', label: t('sourceReuse.sourceTypes.git') },
              { value: 'zip', label: t('sourceReuse.sourceTypes.zip') },
            ]}
            onChange={(value) => setFilters((current) => ({ ...current, sourceType: value as SourceType | undefined }))}
          />
        </Col>
        <Col xs={24} md={12}>
          <Text strong>{t('sourceReuse.filters.projectType')}</Text>
          <Select
            allowClear
            value={filters.detectedType}
            placeholder={t('sourceReuse.filters.projectTypePlaceholder')}
            style={{ width: '100%', marginTop: 8 }}
            options={detectedTypeOptions.map((value) => ({ value, label: getProjectTypeLabel(value) }))}
            onChange={(value) => setFilters((current) => ({ ...current, detectedType: value as ProjectType | undefined }))}
          />
        </Col>
      </Row>

      <Space wrap>
        <Button type="primary" onClick={handleApplyFilters}>{t('sourceReuse.actions.apply')}</Button>
        <Button onClick={handleResetFilters}>{t('sourceReuse.actions.reset')}</Button>
        <Button loading={loading} onClick={() => void fetchSources(query)}>{t('sourceReuse.actions.refresh')}</Button>
        <Text type="secondary">{t('sourceReuse.total', { count: total })}</Text>
      </Space>

      <Text type="secondary">
        {t('sourceReuse.hint')}
      </Text>

      {error && <Alert type="warning" showIcon message={error} />}

      {loading && items.length === 0 ? (
        <Card size="small" loading />
      ) : items.length === 0 ? (
        <Empty
          description={error ? t('sourceReuse.empty.errorDesc') : t('sourceReuse.empty.noneDesc')}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button onClick={handleResetFilters}>{t('sourceReuse.actions.clear')}</Button>
        </Empty>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {items.map((source) => (
              <Col xs={24} md={12} key={source.id}>
                <Card size="small" style={{ height: '100%' }}>
                  <Space direction="vertical" size={10} style={{ width: '100%' }}>
                    <Space wrap>
                      <Tag color={source.source_type === 'zip' ? 'gold' : 'blue'}>
                        {getSourceTypeLabel(source.source_type)}
                      </Tag>
                      <Tag>{getProjectTypeLabel(source.detected_type)}</Tag>
                    </Space>

                    <div>
                      <Text strong>{source.name}</Text>
                      <div style={{ marginTop: 6 }}>
                        <Text type="secondary">
                          {t('sourceReuse.card.sourceId', { id: source.id })}
                          {source.created_by ? t('sourceReuse.card.createdBy', { value: source.created_by }) : ''}
                          {source.updated_at ? t('sourceReuse.card.updatedAt', { value: formatDateTime(source.updated_at) }) : ''}
                        </Text>
                      </div>
                    </div>

                    <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
                      {getSourceSummary(source)}
                    </Paragraph>

                    {source.source_type === 'zip' && (
                      <Space direction="vertical" size={6} style={{ width: '100%' }}>
                        <Space wrap>
                          <Tag color={getSourceIndexTone(source.index?.status).color}>
                            {getSourceIndexTone(source.index?.status).label}
                          </Tag>
                          {source.index && <Tag>{t('sourceReuse.card.fileCount', { count: source.index.file_count })}</Tag>}
                          {source.index && <Tag>{t('sourceReuse.card.chunkCount', { count: source.index.chunk_count })}</Tag>}
                        </Space>
                        <Text type="secondary">{getSourceIndexSummary(source.index)}</Text>
                        {getSourceIndexLastUpdated(source.index) && (
                          <Text type="secondary">
                            {t('sourceReuse.card.indexUpdated', { time: formatDateTime(getSourceIndexLastUpdated(source.index)) })}
                          </Text>
                        )}
                      </Space>
                    )}

                    <Button type="primary" icon={<ArrowRightOutlined />} onClick={() => onSelectSource(source)}>
                      {t('sourceReuse.card.openProfile')}
                    </Button>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          {total > PAGE_SIZE && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Pagination
                current={page}
                pageSize={PAGE_SIZE}
                total={total}
                size="small"
                showSizeChanger={false}
                onChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </Space>
  );
}


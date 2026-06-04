import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  message,
} from 'antd';
import {
  ArrowRightOutlined,
  ImportOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common';
import { benchmarkService } from '@/services/benchmark';
import type {
  BenchmarkCreateSourceListItemView,
  BenchmarkCreateSupportResolveDraftResponse,
  BenchmarkCreateSupportSourcesParams,
  BenchmarkCreateSupportSourcesResponse,
  BenchmarkCreateTemplateCard,
} from '@/types';
import { BenchmarkFormPage } from './BenchmarkCreatePage';

const { Paragraph, Text, Title } = Typography;
const PAGE_SIZE = 6;

type EntryMode = 'reuse_source' | 'template_first' | 'import' | 'advanced_blank';
type BenchmarkImportShortcut = 'file' | 'url' | 'json' | 'yaml';

type SourceTypeFilter = BenchmarkCreateSupportSourcesParams['source_type'];
type DetectedTypeFilter = BenchmarkCreateSupportSourcesParams['detected_type'];

interface SourceFilters {
  name: string;
  sourceType?: SourceTypeFilter;
  detectedType?: DetectedTypeFilter;
  createdBy: string;
}

function createDefaultFilters(): SourceFilters {
  return {
    name: '',
    sourceType: undefined,
    detectedType: undefined,
    createdBy: '',
  };
}

function normalizeFilters(filters: SourceFilters): SourceFilters {
  return {
    name: filters.name.trim(),
    sourceType: filters.sourceType,
    detectedType: filters.detectedType,
    createdBy: filters.createdBy.trim(),
  };
}

function formatDateTime(value?: string) {
  if (!value) {
    return i18next.t('benchmarks:createFlow.unknown');
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : value;
}

function getSourceTypeLabel(value?: SourceTypeFilter) {
  return value === 'zip' ? i18next.t('benchmarks:createFlow.sourceType.zip') : i18next.t('benchmarks:createFlow.sourceType.git');
}

function getDetectedTypeLabel(value?: DetectedTypeFilter) {
  switch (value) {
    case 'backend':
      return i18next.t('benchmarks:createFlow.detectedType.backend');
    case 'frontend':
      return i18next.t('benchmarks:createFlow.detectedType.frontend');
    case 'llm_app':
      return i18next.t('benchmarks:createFlow.detectedType.llmApp');
    case 'agent':
      return i18next.t('benchmarks:createFlow.detectedType.agent');
    case 'unknown':
      return i18next.t('benchmarks:createFlow.detectedType.unknown');
    default:
      return i18next.t('benchmarks:createFlow.uncategorized');
  }
}

function getWorkflowLabel(template: BenchmarkCreateTemplateCard) {
  switch (template.workflow) {
    case 'source_first':
      return i18next.t('benchmarks:createFlow.workflow.sourceFirst');
    case 'template_first':
      return i18next.t('benchmarks:createFlow.workflow.templateFirst');
    case 'import':
      return i18next.t('benchmarks:createFlow.workflow.import');
    default:
      return template.workflow;
  }
}

function getEntryToneLabel(value: EntryMode) {
  switch (value) {
    case 'reuse_source':
      return i18next.t('benchmarks:createFlow.workflow.sourceFirst');
    case 'template_first':
      return i18next.t('benchmarks:createFlow.workflow.templateFirst');
    case 'import':
      return i18next.t('benchmarks:createFlow.workflow.import');
    case 'advanced_blank':
      return i18next.t('benchmarks:createFlow.workflow.advanced');
    default:
      return value;
  }
}

const BENCHMARK_IMPORT_SHORTCUTS: Array<{
  key: BenchmarkImportShortcut;
  title: string;
  description: string;
}> = [
  {
    key: 'file',
    get title() { return i18next.t('benchmarks:createFlow.importShortcuts.file.title'); },
    get description() { return i18next.t('benchmarks:createFlow.importShortcuts.file.description'); },
  },
  {
    key: 'url',
    get title() { return i18next.t('benchmarks:createFlow.importShortcuts.url.title'); },
    get description() { return i18next.t('benchmarks:createFlow.importShortcuts.url.description'); },
  },
  {
    key: 'json',
    get title() { return i18next.t('benchmarks:createFlow.importShortcuts.json.title'); },
    get description() { return i18next.t('benchmarks:createFlow.importShortcuts.json.description'); },
  },
  {
    key: 'yaml',
    get title() { return i18next.t('benchmarks:createFlow.importShortcuts.yaml.title'); },
    get description() { return i18next.t('benchmarks:createFlow.importShortcuts.yaml.description'); },
  },
];

function getSourceRequirementLabel(template: BenchmarkCreateTemplateCard) {
  switch (template.source_requirement) {
    case 'required':
      return i18next.t('benchmarks:createFlow.sourceRequirement.required');
    case 'optional':
      return i18next.t('benchmarks:createFlow.sourceRequirement.optional');
    case 'none':
      return i18next.t('benchmarks:createFlow.sourceRequirement.none');
    default:
      return template.source_requirement;
  }
}

function getStandardAssetPurposeLabel(purpose?: string) {
  switch (purpose) {
    case 'sample_acceptance':
      return i18next.t('benchmarks:createFlow.assetPurpose.sampleAcceptance');
    case 'reusable_capability':
      return i18next.t('benchmarks:createFlow.assetPurpose.reusableCapability');
    case undefined:
    case '':
      return i18next.t('benchmarks:createFlow.assetPurpose.unspecified');
    default:
      return purpose;
  }
}

function getStandardAssetPurposeDescription(purpose?: string) {
  switch (purpose) {
    case 'sample_acceptance':
      return i18next.t('benchmarks:createFlow.assetPurpose.sampleAcceptanceDesc');
    case 'reusable_capability':
      return i18next.t('benchmarks:createFlow.assetPurpose.reusableCapabilityDesc');
    case undefined:
    case '':
      return i18next.t('benchmarks:createFlow.assetPurpose.unspecifiedDesc');
    default:
      return i18next.t('benchmarks:createFlow.assetPurpose.customDesc', { purpose });
  }
}

function getStandardAssetPurposeColor(purpose?: string) {
  switch (purpose) {
    case 'sample_acceptance':
      return 'cyan';
    case 'reusable_capability':
      return 'purple';
    default:
      return 'default';
  }
}

function hasStandardAssetHints(template: BenchmarkCreateTemplateCard) {
  return Boolean(
    template.standard_asset_purpose
      || template.supported_framework_families?.length
      || template.validation_lanes?.length,
  );
}

function renderTemplateStandardAssetSummary(template: BenchmarkCreateTemplateCard) {
  if (!hasStandardAssetHints(template)) {
    return (
      <Text type="secondary">
        {i18next.t('benchmarks:createFlow.templateStep.noStandardAsset')}
      </Text>
    );
  }

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Text type="secondary">
        {getStandardAssetPurposeDescription(template.standard_asset_purpose)}
      </Text>
      {template.validation_lanes && template.validation_lanes.length > 0 && (
        <Space size={[4, 4]} wrap>
          <Text type="secondary">{i18next.t('benchmarks:createFlow.templateStep.validationLanes')}</Text>
          {template.validation_lanes.map((lane) => (
            <Tag key={`${template.key}-lane-${lane}`}>{lane}</Tag>
          ))}
        </Space>
      )}
      {template.supported_framework_families && template.supported_framework_families.length > 0 && (
        <Space size={[4, 4]} wrap>
          <Text type="secondary">{i18next.t('benchmarks:createFlow.templateStep.frameworkFamilies')}</Text>
          {template.supported_framework_families.map((framework) => (
            <Tag key={`${template.key}-framework-${framework}`}>{framework}</Tag>
          ))}
        </Space>
      )}
    </Space>
  );
}

function getSourceSummary(source: BenchmarkCreateSourceListItemView) {
  if (source.source_type === 'git') {
    const details = [
      source.git_url,
      source.branch ? i18next.t('benchmarks:createFlow.sourceSummary.branchLabel', { branch: source.branch }) : undefined,
      source.commit_sha ? i18next.t('benchmarks:createFlow.sourceSummary.commitLabel', { commit: source.commit_sha.slice(0, 12) }) : undefined,
    ].filter(Boolean);
    return details.length > 0 ? details.join(' | ') : i18next.t('benchmarks:createFlow.sourceSummary.incompleteGit');
  }

  const details = [
    source.index ? i18next.t('benchmarks:createFlow.sourceSummary.fileCount', { count: source.index.file_count }) : undefined,
    source.index ? i18next.t('benchmarks:createFlow.sourceSummary.chunkCount', { count: source.index.chunk_count }) : undefined,
    source.index?.status ? i18next.t('benchmarks:createFlow.sourceSummary.indexStatus', { status: source.index.status }) : undefined,
  ].filter(Boolean);

  return details.length > 0 ? details.join(' | ') : i18next.t('benchmarks:createFlow.sourceSummary.completeZip');
}

function buildAdvancedBanner(
  resolvedDraft: BenchmarkCreateSupportResolveDraftResponse | null,
) {
  if (!resolvedDraft) {
    return (
      <Alert
        type="info"
        showIcon
        message={i18next.t('benchmarks:createFlow.advancedBanner.title')}
        description={i18next.t('benchmarks:createFlow.advancedBanner.description')}
      />
    );
  }

  return (
    <Alert
      type="info"
      showIcon
      message={i18next.t('benchmarks:createFlow.advancedBanner.appliedTitle', {
        template: resolvedDraft.template.display_name,
        source: resolvedDraft.source ? ` · ${resolvedDraft.source.name}` : '',
      })}
      description={(
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Text>
            {i18next.t('benchmarks:createFlow.advancedBanner.appliedDescription')}
          </Text>
          <Space wrap>
            <Tag>{getWorkflowLabel(resolvedDraft.template)}</Tag>
            <Tag>{getSourceRequirementLabel(resolvedDraft.template)}</Tag>
            {resolvedDraft.template.standard_asset_purpose && (
              <Tag color={getStandardAssetPurposeColor(resolvedDraft.template.standard_asset_purpose)}>
                {getStandardAssetPurposeLabel(resolvedDraft.template.standard_asset_purpose)}
              </Tag>
            )}
            {resolvedDraft.language_candidates?.map((language) => (
              <Tag key={language}>{language}</Tag>
            ))}
            {resolvedDraft.template.validation_lanes?.map((lane) => (
              <Tag key={`${resolvedDraft.template.key}-banner-lane-${lane}`}>{lane}</Tag>
            ))}
          </Space>
          {hasStandardAssetHints(resolvedDraft.template) && (
            <Text type="secondary">
              {getStandardAssetPurposeDescription(resolvedDraft.template.standard_asset_purpose)}
            </Text>
          )}
          {resolvedDraft.warnings && resolvedDraft.warnings.length > 0 && (
            <div>
              {resolvedDraft.warnings.map((warning) => (
                <div key={warning.code}>
                  <Text type="warning">{warning.message}</Text>
                </div>
              ))}
            </div>
          )}
        </Space>
      )}
    />
  );
}
export default function BenchmarkCreateFlowPage() {
  const { t } = useTranslation('benchmarks');
  const navigate = useNavigate();
  const [entryMode, setEntryMode] = useState<EntryMode>('reuse_source');
  const [stage, setStage] = useState<'entry' | 'advanced'>('entry');

  const [templates, setTemplates] = useState<BenchmarkCreateTemplateCard[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  const [filters, setFilters] = useState<SourceFilters>(() => createDefaultFilters());
  const [appliedFilters, setAppliedFilters] = useState<SourceFilters>(() => createDefaultFilters());
  const [page, setPage] = useState(1);
  const [sources, setSources] = useState<BenchmarkCreateSourceListItemView[]>([]);
  const [totalSources, setTotalSources] = useState(0);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [sourcesError, setSourcesError] = useState<string | null>(null);

  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<BenchmarkCreateSourceListItemView | null>(null);
  const [resolvedDraft, setResolvedDraft] = useState<BenchmarkCreateSupportResolveDraftResponse | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  const selectedTemplate = useMemo(() => {
    return templates.find((item) => item.key === selectedTemplateKey) ?? null;
  }, [selectedTemplateKey, templates]);

  const recommendedTemplateKeys = useMemo(() => {
    return new Set(selectedSource?.recommended_template_keys ?? []);
  }, [selectedSource]);

  const templateCards = useMemo(() => {
    const nonImportTemplates = templates.filter((item) => item.workflow !== 'import');
    const scopedTemplates =
      entryMode === 'reuse_source'
        ? nonImportTemplates.filter((item) => item.workflow === 'source_first')
        : nonImportTemplates;

    return [...scopedTemplates].sort((left, right) => {
      const leftRecommended = recommendedTemplateKeys.has(left.key) ? 1 : 0;
      const rightRecommended = recommendedTemplateKeys.has(right.key) ? 1 : 0;
      if (leftRecommended !== rightRecommended) {
        return rightRecommended - leftRecommended;
      }
      if (left.recommended !== right.recommended) {
        return Number(right.recommended) - Number(left.recommended);
      }
      return left.display_name.localeCompare(right.display_name);
    });
  }, [entryMode, recommendedTemplateKeys, templates]);

  const query = useMemo<BenchmarkCreateSupportSourcesParams>(() => {
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

  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const response = await benchmarkService.listCreateSupportTemplates({ silentError: true });
      const payload = response as unknown as BenchmarkCreateTemplateCard[];
      setTemplates(Array.isArray(payload) ? payload : []);
      setTemplatesError(null);
    } catch (fetchError: unknown) {
      const response = (fetchError as { response?: { data?: { message?: string } } })?.response;
      setTemplates([]);
      setTemplatesError(response?.data?.message || t('createFlow.messages.loadTemplatesFailed'));
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const fetchSources = useCallback(async (params: BenchmarkCreateSupportSourcesParams) => {
    setSourcesLoading(true);
    try {
      const response = await benchmarkService.listCreateSupportSources(params, { silentError: true });
      const payload = response as unknown as BenchmarkCreateSupportSourcesResponse;
      setSources(Array.isArray(payload.items) ? payload.items : []);
      setTotalSources(typeof payload.total === 'number' ? payload.total : 0);
      setSourcesError(null);
    } catch (fetchError: unknown) {
      const response = (fetchError as { response?: { data?: { message?: string } } })?.response;
      setSources([]);
      setTotalSources(0);
      setSourcesError(response?.data?.message || t('createFlow.messages.loadSourcesFailed'));
    } finally {
      setSourcesLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    if (stage !== 'entry' || entryMode === 'import' || entryMode === 'advanced_blank') {
      return;
    }
    void fetchSources(query);
  }, [entryMode, fetchSources, query, stage]);

  useEffect(() => {
    if (!selectedSourceId) {
      return;
    }
    const refreshedSource = sources.find((item) => item.id === selectedSourceId);
    if (refreshedSource) {
      setSelectedSource(refreshedSource);
    }
  }, [selectedSourceId, sources]);

  const handleEntryModeChange = useCallback((nextMode: EntryMode) => {
    setEntryMode(nextMode);
    setResolvedDraft(null);
    setResolveError(null);
  }, []);

  useEffect(() => {
    if (!selectedTemplate) {
      return;
    }
    if (entryMode === 'reuse_source' && selectedTemplate.workflow !== 'source_first') {
      const fallbackTemplate = templateCards[0];
      setSelectedTemplateKey(fallbackTemplate?.key ?? null);
    }
  }, [entryMode, selectedTemplate, templateCards]);

  const handleSelectSource = useCallback((source: BenchmarkCreateSourceListItemView) => {
    setSelectedSourceId(source.id);
    setSelectedSource(source);
    setResolvedDraft(null);
    setResolveError(null);

    if (!selectedTemplateKey && source.recommended_template_keys && source.recommended_template_keys.length > 0) {
      setSelectedTemplateKey(source.recommended_template_keys[0]);
    }
  }, [selectedTemplateKey]);

  const handleSelectTemplate = useCallback((templateKey: string) => {
    setSelectedTemplateKey(templateKey);
    setResolvedDraft(null);
    setResolveError(null);
  }, []);

  const handleApplyFilters = useCallback(() => {
    setPage(1);
    setAppliedFilters(normalizeFilters(filters));
  }, [filters]);

  const handleResetFilters = useCallback(() => {
    const nextFilters = createDefaultFilters();
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setPage(1);
    setSourcesError(null);
  }, []);

  const handleOpenImportWorkspace = useCallback((sourceType?: BenchmarkImportShortcut) => {
    if (!sourceType) {
      navigate('/benchmarks/create/import');
      return;
    }

    navigate(`/benchmarks/create/import?source=${encodeURIComponent(sourceType)}`);
  }, [navigate]);

  const handleOpenAdvancedBlank = useCallback(() => {
    setResolvedDraft(null);
    setResolveError(null);
    setStage('advanced');
  }, []);

  const handlePrepareDraft = useCallback(async () => {
    if (!selectedTemplateKey) {
      message.warning(t('createFlow.messages.selectTemplateFirst'));
      return;
    }

    setResolving(true);
    try {
      const response = await benchmarkService.resolveCreateSupportDraft(
        {
          template_key: selectedTemplateKey,
          source_id: selectedSourceId || undefined,
        },
        { silentError: true }
      );
      const payload = response as unknown as BenchmarkCreateSupportResolveDraftResponse;
      setResolvedDraft(payload);
      setResolveError(null);

      if (payload.can_submit) {
        setStage('advanced');
        return;
      }

      message.warning(t('createFlow.messages.missingRequirements'));
    } catch (fetchError: unknown) {
      const response = (fetchError as { response?: { data?: { message?: string } } })?.response;
      setResolvedDraft(null);
      setResolveError(response?.data?.message || t('createFlow.messages.draftFailed'));
    } finally {
      setResolving(false);
    }
  }, [selectedSourceId, selectedTemplateKey]);

  const advancedBanner = useMemo(() => {
    return buildAdvancedBanner(resolvedDraft);
  }, [resolvedDraft]);

  const advancedKey = useMemo(() => {
    if (!resolvedDraft) {
      return 'advanced-blank';
    }
    return `advanced-${resolvedDraft.template.key}-${resolvedDraft.source?.id ?? 'none'}-${resolvedDraft.create_request.name}`;
  }, [resolvedDraft]);

  if (stage === 'advanced') {
    return (
      <BenchmarkFormPage
        key={advancedKey}
        mode="create"
        createPayloadDefaults={resolvedDraft?.create_request}
        banner={advancedBanner}
        onBack={() => setStage('entry')}
        backLabel={t('createFlow.backToCreateEntry')}
      />
    );
  }

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <PageHeader
        title={t('createFlow.pageTitle')}
        description={t('createFlow.pageDescription')}
        breadcrumb={[{ title: t('createFlow.breadcrumbWorkspace') }, { title: t('createFlow.breadcrumbBenchmarks') }, { title: t('createFlow.breadcrumbCreate') }]}
        extra={(
          <Space wrap>
            <Button onClick={() => navigate('/benchmarks')}>{t('createFlow.backToList')}</Button>
            <Button icon={<ImportOutlined />} onClick={() => handleOpenImportWorkspace()}>{t('createFlow.importWorkspace')}</Button>
          </Space>
        )}
      />

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space wrap>
            <Tag color="blue">{t('createFlow.tagBackendResolve')}</Tag>
            <Tag color="green">{t('createFlow.tagSourceAware')}</Tag>
            <Tag color="purple">{t('createFlow.tagTruthAware')}</Tag>
            <Tag color="gold">{t('createFlow.tagAdvancedEditor')}</Tag>
          </Space>
          <Text type="secondary">
            {t('createFlow.introNote')}
          </Text>
          <Alert
            type="info"
            showIcon
            message={t('createFlow.truthNotice.title')}
            description={t('createFlow.truthNotice.description')}
          />
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          {
            key: 'reuse_source' as const,
            title: t('createFlow.entryCards.reuseSource.title'),
            tone: 'source-first',
            description: t('createFlow.entryCards.reuseSource.description'),
          },
          {
            key: 'template_first' as const,
            title: t('createFlow.entryCards.templateFirst.title'),
            tone: 'template-first',
            description: t('createFlow.entryCards.templateFirst.description'),
          },
          {
            key: 'import' as const,
            title: t('createFlow.entryCards.import.title'),
            tone: 'import',
            description: t('createFlow.entryCards.import.description'),
          },
          {
            key: 'advanced_blank' as const,
            title: t('createFlow.entryCards.advancedBlank.title'),
            tone: 'advanced',
            description: t('createFlow.entryCards.advancedBlank.description'),
          },
        ].map((option) => {
          const active = entryMode === option.key;
          return (
            <Col xs={24} md={12} xl={6} key={option.key}>
              <Card
                hoverable
                onClick={() => handleEntryModeChange(option.key)}
                style={{
                  height: '100%',
                  borderColor: active ? '#1677ff' : undefined,
                  boxShadow: active ? '0 0 0 1px rgba(22, 119, 255, 0.25)' : undefined,
                }}
                >
                  <Space direction="vertical" size={10} style={{ width: '100%' }}>
                    <Space wrap>
                      <Tag color={active ? 'blue' : 'default'}>{getEntryToneLabel(option.key)}</Tag>
                      {option.key !== 'import' && <Tag>{option.key === 'advanced_blank' ? t('createFlow.entryCards.expertMode') : t('createFlow.entryCards.guidedMode')}</Tag>}
                    </Space>
                  <Title level={5} style={{ margin: 0 }}>{option.title}</Title>
                  <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    {option.description}
                  </Paragraph>
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>

      {entryMode === 'import' && (
        <Card>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Alert
              type="info"
              showIcon
              message={t('createFlow.importPanel.alertTitle')}
              description={(
                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  <Text>{t('createFlow.importPanel.alertDescription')}</Text>
                  <Text type="secondary">{t('createFlow.importPanel.standardSchemaHint')}</Text>
                </Space>
              )}
            />
            <Row gutter={[12, 12]}>
              {BENCHMARK_IMPORT_SHORTCUTS.map((shortcut) => (
                <Col xs={24} md={12} xl={6} key={shortcut.key}>
                  <Card
                    hoverable
                    size="small"
                    onClick={() => handleOpenImportWorkspace(shortcut.key)}
                    style={{ height: '100%' }}
                  >
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      <Tag color="blue">{shortcut.key}</Tag>
                      <Text strong>{shortcut.title}</Text>
                      <Text type="secondary">{shortcut.description}</Text>
                      <Button type="link" style={{ padding: 0 }} icon={<ImportOutlined />}>
                        {t('createFlow.importPanel.startFrom', { title: shortcut.title })}
                      </Button>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
            <Space wrap>
              <Button type="primary" icon={<ImportOutlined />} onClick={() => handleOpenImportWorkspace()}>
                {t('createFlow.importPanel.openWorkspace')}
              </Button>
              <Button onClick={() => handleEntryModeChange('template_first')}>{t('createFlow.importPanel.switchToTemplate')}</Button>
            </Space>
          </Space>
        </Card>
      )}

      {entryMode === 'advanced_blank' && (
        <Card>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Alert
              type="warning"
              showIcon
              message={t('createFlow.advancedPanel.alertTitle')}
              description={t('createFlow.advancedPanel.alertDescription')}
            />
            <Space wrap>
              <Button type="primary" icon={<ArrowRightOutlined />} onClick={handleOpenAdvancedBlank}>
                {t('createFlow.advancedPanel.enterAdvanced')}
              </Button>
              <Button onClick={() => handleEntryModeChange('reuse_source')}>{t('createFlow.advancedPanel.switchToSource')}</Button>
            </Space>
          </Space>
        </Card>
      )}

      {entryMode !== 'import' && entryMode !== 'advanced_blank' && (
        <>
          <Row gutter={[24, 24]}>
            <Col xs={24} xl={12}>
              <Card
                title={entryMode === 'reuse_source' ? t('createFlow.sourceStep.titleStep1') : t('createFlow.sourceStep.titleStep2')}
                extra={<Button icon={<ReloadOutlined />} loading={sourcesLoading} onClick={() => void fetchSources(query)}>{t('createFlow.sourceStep.refresh')}</Button>}
              >
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <Alert
                    type="info"
                    showIcon
                    message={entryMode === 'reuse_source' ? t('createFlow.sourceStep.alertSourceFirstTitle') : t('createFlow.sourceStep.alertOptionalTitle')}
                    description={
                      entryMode === 'reuse_source'
                        ? t('createFlow.sourceStep.alertSourceFirstDesc')
                        : t('createFlow.sourceStep.alertOptionalDesc')
                    }
                  />

                  <Row gutter={[12, 12]}>
                    <Col xs={24} md={12}>
                      <Text strong>{t('createFlow.sourceStep.searchByName')}</Text>
                      <Input
                        style={{ marginTop: 8 }}
                        placeholder={t('createFlow.sourceStep.searchPlaceholder')}
                        value={filters.name}
                        onChange={(event) => setFilters((current) => ({ ...current, name: event.target.value }))}
                        onPressEnter={handleApplyFilters}
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <Text strong>{t('createFlow.sourceStep.creator')}</Text>
                      <Input
                        style={{ marginTop: 8 }}
                        placeholder={t('createFlow.sourceStep.creatorPlaceholder')}
                        value={filters.createdBy}
                        onChange={(event) => setFilters((current) => ({ ...current, createdBy: event.target.value }))}
                        onPressEnter={handleApplyFilters}
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <Text strong>{t('createFlow.sourceStep.sourceTypeLabel')}</Text>
                      <Select
                        allowClear
                        style={{ width: '100%', marginTop: 8 }}
                        placeholder={t('createFlow.sourceStep.anyType')}
                        value={filters.sourceType}
                        options={[
                          { value: 'git', label: 'Git Source' },
                          { value: 'zip', label: 'ZIP Source' },
                        ]}
                        onChange={(value) => setFilters((current) => ({ ...current, sourceType: value as SourceTypeFilter | undefined }))}
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <Text strong>{t('createFlow.sourceStep.detectedTypeLabel')}</Text>
                      <Select
                        allowClear
                        style={{ width: '100%', marginTop: 8 }}
                        placeholder={t('createFlow.sourceStep.anyType')}
                        value={filters.detectedType}
                        options={[
                          { value: 'backend', label: t('createFlow.detectedType.backend') },
                          { value: 'frontend', label: t('createFlow.detectedType.frontend') },
                          { value: 'llm_app', label: t('createFlow.detectedType.llmApp') },
                          { value: 'agent', label: t('createFlow.detectedType.agent') },
                          { value: 'unknown', label: t('createFlow.detectedType.unknown') },
                        ]}
                        onChange={(value) => setFilters((current) => ({ ...current, detectedType: value as DetectedTypeFilter | undefined }))}
                      />
                    </Col>
                  </Row>

                  <Space wrap>
                    <Button type="primary" onClick={handleApplyFilters}>{t('createFlow.sourceStep.applyFilters')}</Button>
                    <Button onClick={handleResetFilters}>{t('createFlow.sourceStep.reset')}</Button>
                    <Text type="secondary">{t('createFlow.sourceStep.visibleSources', { count: totalSources })}</Text>
                  </Space>

                  {sourcesError && <Alert type="warning" showIcon message={sourcesError} />}

                  {sourcesLoading && sources.length === 0 ? (
                    <Card size="small" loading />
                  ) : sources.length === 0 ? (
                    <Empty
                      description={t('createFlow.sourceStep.emptyDescription')}
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                      <Button onClick={handleResetFilters}>{t('createFlow.sourceStep.clearFilters')}</Button>
                    </Empty>
                  ) : (
                    <>
                      <Row gutter={[16, 16]}>
                        {sources.map((source) => {
                          const active = selectedSourceId === source.id;
                          const recommendedCount = source.recommended_template_keys?.length ?? 0;
                          return (
                            <Col xs={24} md={12} key={source.id}>
                              <Card
                                size="small"
                                hoverable
                                onClick={() => handleSelectSource(source)}
                                style={{
                                  height: '100%',
                                  borderColor: active ? '#1677ff' : undefined,
                                  boxShadow: active ? '0 0 0 1px rgba(22, 119, 255, 0.2)' : undefined,
                                }}
                              >
                                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                                  <Space wrap>
                                    <Tag color={source.source_type === 'zip' ? 'gold' : 'blue'}>
                                      {getSourceTypeLabel(source.source_type)}
                                    </Tag>
                                    <Tag>{getDetectedTypeLabel(source.detected_type)}</Tag>
                                    {recommendedCount > 0 && <Tag color="green">{t('createFlow.sourceStep.recommendedCount', { count: recommendedCount })}</Tag>}
                                  </Space>

                                  <div>
                                    <Text strong>{source.name}</Text>
                                    <div style={{ marginTop: 6 }}>
                                      <Text type="secondary">
                                        {t('createFlow.sourceStep.sourceMeta', { id: source.id, time: formatDateTime(source.updated_at) })}
                                      </Text>
                                    </div>
                                  </div>

                                  <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
                                    {getSourceSummary(source)}
                                  </Paragraph>

                                  <Button type={active ? 'primary' : 'default'}>
                                    {active ? t('createFlow.sourceStep.selected') : t('createFlow.sourceStep.selectSource')}
                                  </Button>
                                </Space>
                              </Card>
                            </Col>
                          );
                        })}
                      </Row>

                      {totalSources > PAGE_SIZE && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Pagination
                            current={page}
                            pageSize={PAGE_SIZE}
                            total={totalSources}
                            showSizeChanger={false}
                            size="small"
                            onChange={setPage}
                          />
                        </div>
                      )}
                    </>
                  )}
                </Space>
              </Card>
            </Col>

            <Col xs={24} xl={12}>
              <Card
                title={entryMode === 'reuse_source' ? t('createFlow.templateStep.titleStep2') : t('createFlow.templateStep.titleStep1')}
                extra={<Text type="secondary">{t('createFlow.templateStep.totalTemplates', { count: templateCards.length })}</Text>}
              >
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <Alert
                    type="info"
                    showIcon
                    message={entryMode === 'reuse_source' ? t('createFlow.templateStep.alertSourceFirstTitle') : t('createFlow.templateStep.alertTemplateFirstTitle')}
                    description={
                      entryMode === 'reuse_source'
                        ? t('createFlow.templateStep.alertSourceFirstDesc')
                        : t('createFlow.templateStep.alertTemplateFirstDesc')
                    }
                  />

                  {templatesError && <Alert type="warning" showIcon message={templatesError} />}

                  {templatesLoading && templateCards.length === 0 ? (
                    <Card size="small" loading />
                  ) : templateCards.length === 0 ? (
                    <Empty description={t('createFlow.templateStep.noTemplates')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    <Row gutter={[16, 16]}>
                      {templateCards.map((template) => {
                        const active = selectedTemplateKey === template.key;
                        const recommendedBySource = recommendedTemplateKeys.has(template.key);
                        return (
                          <Col xs={24} key={template.key}>
                            <Card
                              hoverable
                              onClick={() => handleSelectTemplate(template.key)}
                              style={{
                                borderColor: active ? '#1677ff' : undefined,
                                boxShadow: active ? '0 0 0 1px rgba(22, 119, 255, 0.2)' : undefined,
                              }}
                            >
                              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                                <Space wrap>
                                  <Tag color={template.recommended ? 'blue' : 'default'}>
                                    {template.recommended ? t('createFlow.templateStep.recommended') : t('createFlow.templateStep.optional')}
                                  </Tag>
                                  <Tag>{getWorkflowLabel(template)}</Tag>
                                  <Tag>{getSourceRequirementLabel(template)}</Tag>
                                  {template.standard_asset_purpose && (
                                    <Tag color={getStandardAssetPurposeColor(template.standard_asset_purpose)}>
                                      {getStandardAssetPurposeLabel(template.standard_asset_purpose)}
                                    </Tag>
                                  )}
                                  {recommendedBySource && <Tag color="green">{t('createFlow.templateStep.matchesSource')}</Tag>}
                                </Space>

                                <div>
                                  <Text strong>{template.display_name}</Text>
                                  <div style={{ marginTop: 6 }}>
                                    <Text type="secondary">{template.key}</Text>
                                  </div>
                                </div>

                                <Paragraph style={{ marginBottom: 0 }}>{template.description}</Paragraph>

                                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                                  <Text strong>{t('createFlow.templateStep.standardAsset')}</Text>
                                  {renderTemplateStandardAssetSummary(template)}
                                </Space>

                                <Space wrap>
                                  {template.default_benchmark_type && <Tag>{template.default_benchmark_type}</Tag>}
                                  {template.suggested_languages?.map((language) => (
                                    <Tag key={`${template.key}-${language}`}>{language}</Tag>
                                  ))}
                                </Space>

                                <Button type={active ? 'primary' : 'default'}>
                                  {active ? t('createFlow.sourceStep.selected') : t('createFlow.templateStep.useTemplate')}
                                </Button>
                              </Space>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  )}
                </Space>
              </Card>
            </Col>
          </Row>

          <Card style={{ marginTop: 24 }}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Space direction="vertical" size={4}>
                <Title level={5} style={{ margin: 0 }}>{t('createFlow.draftStep.title')}</Title>
                <Text type="secondary">
                  {t('createFlow.draftStep.description')}
                </Text>
              </Space>

              <Row gutter={[16, 16]}>
                <Col xs={24} xl={12}>
                  <Card size="small" title={t('createFlow.draftStep.currentTemplate')}>
                    {selectedTemplate ? (
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                          <Text strong>{selectedTemplate.display_name}</Text>
                          <Text type="secondary">{selectedTemplate.description}</Text>
                          <Space wrap>
                            <Tag>{getWorkflowLabel(selectedTemplate)}</Tag>
                            <Tag>{getSourceRequirementLabel(selectedTemplate)}</Tag>
                            {selectedTemplate.standard_asset_purpose && (
                              <Tag color={getStandardAssetPurposeColor(selectedTemplate.standard_asset_purpose)}>
                                {getStandardAssetPurposeLabel(selectedTemplate.standard_asset_purpose)}
                              </Tag>
                            )}
                          </Space>
                          {hasStandardAssetHints(selectedTemplate) && (
                            <Text type="secondary">
                              {getStandardAssetPurposeDescription(selectedTemplate.standard_asset_purpose)}
                            </Text>
                          )}
                        </Space>
                    ) : (
                      <Text type="secondary">{t('createFlow.draftStep.noTemplate')}</Text>
                    )}
                  </Card>
                </Col>
                <Col xs={24} xl={12}>
                  <Card size="small" title={t('createFlow.draftStep.currentSource')}>
                    {selectedSource ? (
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Text strong>{selectedSource.name}</Text>
                        <Text type="secondary">{getSourceSummary(selectedSource)}</Text>
                        <Space wrap>
                          <Tag>{getSourceTypeLabel(selectedSource.source_type)}</Tag>
                          <Tag>{getDetectedTypeLabel(selectedSource.detected_type)}</Tag>
                        </Space>
                      </Space>
                    ) : (
                      <Text type="secondary">{t('createFlow.draftStep.noSource')}</Text>
                    )}
                  </Card>
                </Col>
              </Row>

              <Space wrap>
                <Button
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  loading={resolving}
                  disabled={!selectedTemplateKey}
                  onClick={handlePrepareDraft}
                >
                  {t('createFlow.draftStep.generateDraft')}
                </Button>
                <Button onClick={handleOpenAdvancedBlank}>{t('createFlow.draftStep.skipGuide')}</Button>
              </Space>

              {resolveError && <Alert type="error" showIcon message={resolveError} />}

              {resolvedDraft && !resolvedDraft.can_submit && (
                <Alert
                  type="warning"
                  showIcon
                  message={t('createFlow.draftStep.cannotEnterTitle')}
                  description={(
                    <Space direction="vertical" size={6} style={{ width: '100%' }}>
                      {resolvedDraft.missing_requirements?.map((item) => (
                        <div key={item.code}>
                          <Text strong>{item.field}</Text>
                          <div>{item.message}</div>
                        </div>
                      ))}
                      {resolvedDraft.warnings?.map((warning) => (
                        <div key={warning.code}>
                          <Text type="warning">{warning.message}</Text>
                        </div>
                      ))}
                    </Space>
                  )}
                />
              )}
            </Space>
          </Card>
        </>
      )}
    </div>
  );
}

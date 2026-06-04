import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Divider,
  Empty,
  Progress,
  Row,
  Select,
  Space,
  Steps,
  Tag,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined, RocketOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { PageHeader } from '@/components/common';
import RunRecommendationCard from '@/components/project-eval/RunRecommendationCard';
import {
  clearProjectEvalProfileDraft,
  createDefaultProjectEvalProfileDraft,
  loadProjectEvalProfileDraft,
  normalizeProjectTypeValue,
  saveProjectEvalProfileDraft,
  type ProjectEvalProfileDraft,
  type ProjectEvalRunSettingsDraft,
} from '@/components/project-eval/profileDraft';
import {
  formatDateTime,
  getPlanningGuidanceSummaryText,
  getProjectTypeLabel,
  getRunModeLabel,
  getScopeLabel,
  getSourceIndexLastUpdated,
  getSourceIndexSummary,
  getSourceIndexTone,
  humanizeKey,
  translatePlanningGuidanceText,
} from '@/components/project-eval/helpers';
import { projectEvalService } from '@/services/project-eval';
import type {
  EvaluationScope,
  ProjectEvalCapabilities,
  ProjectEvalCreateRunDefaults,
  ProjectEvalDefaults,
  ProjectEvalSource,
  ProjectType,
  RunPlanningGuidanceView,
  RunMode,
} from '@/types/api/project-eval';

const { Paragraph, Text, Title } = Typography;

interface RecommendationItem<TValue extends string> {
  value: TValue;
  title: string;
  description: string;
  bullets: string[];
  footnote: string;
  recommended?: boolean;
}

type RunSettingsPatch = Partial<ProjectEvalRunSettingsDraft>;

const RUN_MODE_RECOMMENDATIONS: RecommendationItem<RunMode>[] = [
  {
    value: 'advisory',
    get title() { return i18next.t('projectEval:modes.advisory.title'); },
    get description() { return i18next.t('projectEval:modes.advisory.description'); },
    get bullets() { return i18next.t('projectEval:modes.advisory.bullets', { returnObjects: true }) as string[]; },
    get footnote() { return i18next.t('projectEval:modes.advisory.footnote'); },
    recommended: true,
  },
  {
    value: 'strict',
    get title() { return i18next.t('projectEval:modes.strict.title'); },
    get description() { return i18next.t('projectEval:modes.strict.description'); },
    get bullets() { return i18next.t('projectEval:modes.strict.bullets', { returnObjects: true }) as string[]; },
    get footnote() { return i18next.t('projectEval:modes.strict.footnote'); },
  },
];

const SCOPE_RECOMMENDATIONS: RecommendationItem<EvaluationScope>[] = [
  {
    value: 'full',
    get title() { return i18next.t('projectEval:modes.full.title'); },
    get description() { return i18next.t('projectEval:modes.full.description'); },
    get bullets() { return i18next.t('projectEval:modes.full.bullets', { returnObjects: true }) as string[]; },
    get footnote() { return i18next.t('projectEval:modes.full.footnote'); },
    recommended: true,
  },
  {
    value: 'delta',
    get title() { return i18next.t('projectEval:modes.delta.title'); },
    get description() { return i18next.t('projectEval:modes.delta.description'); },
    get bullets() { return i18next.t('projectEval:modes.delta.bullets', { returnObjects: true }) as string[]; },
    get footnote() { return i18next.t('projectEval:modes.delta.footnote'); },
  },
];

function getConfidenceColor(value?: string): string | undefined {
  switch (value) {
    case 'high':
      return 'green';
    case 'medium':
      return 'gold';
    default:
      return undefined;
  }
}

function getSourceTypeLabel(value?: string): string {
  return value === 'zip' ? i18next.t('projectEval:profilePage.sourceTypeZip') : i18next.t('projectEval:profilePage.sourceTypeGit');
}

function getScorePercent(value: number, maxValue: number): number {
  if (maxValue <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round((value / maxValue) * 100)));
}

function getMetadataString(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function getMetadataBoolean(metadata: Record<string, unknown> | undefined, key: string): boolean | undefined {
  const value = metadata?.[key];
  return typeof value === 'boolean' ? value : undefined;
}

function getMetadataNumber(metadata: Record<string, unknown> | undefined, key: string): number | undefined {
  const value = metadata?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function getMetadataRecord(metadata: Record<string, unknown> | undefined, key: string): Record<string, unknown> | undefined {
  const value = metadata?.[key];
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function getMetadataRecordList(metadata: Record<string, unknown> | undefined, key: string): Record<string, unknown>[] {
  const value = metadata?.[key];
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item)),
  );
}

function getMetadataStringList(metadata: Record<string, unknown> | undefined, key: string): string[] {
  const value = metadata?.[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    : [];
}

function normalizeRunModeHint(value: unknown): RunMode | undefined {
  return value === 'advisory' || value === 'strict' ? value : undefined;
}

function getSupportStatusColor(value?: string): string {
  switch (value) {
    case 'accepted':
      return 'green';
    case 'provisional':
      return 'gold';
    case 'exploratory':
      return 'purple';
    default:
      return 'default';
  }
}

function getFreshnessColor(value?: string): string {
  switch (value) {
    case 'fresh':
      return 'green';
    case 'aging':
      return 'gold';
    case 'stale':
      return 'red';
    default:
      return 'default';
  }
}

function getNoteAlertType(severity?: string): 'success' | 'info' | 'warning' | 'error' {
  switch (severity) {
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    default:
      return 'info';
  }
}

function mergeRunSettingsWithDefaults(
  current: ProjectEvalRunSettingsDraft,
  defaults: ProjectEvalCreateRunDefaults,
): ProjectEvalRunSettingsDraft {
  return {
    ...current,
    runMode: defaults.mode,
    runProjectType: defaults.project_type,
    runScope: defaults.scope,
    evaluationDepth: defaults.evaluation_depth,
    projectFamily: defaults.project_family,
    frameworkFamily: defaults.framework_family,
    templateFamily: defaults.template_family,
    reportVariant: defaults.report_variant,
    reportVariants: defaults.report_variants,
  };
}

function compactStringList(values: Array<string | undefined>): string[] {
  return values.filter((value): value is string => Boolean(value && value.trim()));
}

function getCapabilityLabel(item: { id: string; display_name?: string } | undefined, fallback?: string): string {
  return item?.display_name || fallback || (item?.id ? humanizeKey(item.id) : '-');
}

function renderGuidanceTags(values?: string[], emptyText?: string) {
  if (!values || values.length === 0) {
    return <Text type="secondary">{emptyText ?? i18next.t('projectEval:profilePage.emptyTagPlaceholder')}</Text>;
  }

  return (
    <Space wrap size={4}>
      {values.slice(0, 8).map((value) => (
        <Tag key={value}>{translatePlanningGuidanceText(value) || humanizeKey(value)}</Tag>
      ))}
      {values.length > 8 && <Tag>+{values.length - 8}</Tag>}
    </Space>
  );
}

function PlanningGuidancePreviewCard({ guidance }: { guidance: RunPlanningGuidanceView }) {
  const { t } = useTranslation('projectEval');
  const warnings = guidance.warnings ?? [];
  const hasWarnings = warnings.length > 0;
  const commandCount =
    (guidance.test_command_candidates?.length ?? 0) +
    (guidance.support_command_candidates?.length ?? 0);

  return (
    <Card
      size="small"
      title={(
        <Space wrap>
          <span>{t('profilePage.guidanceTitle')}</span>
          <Tag color="blue">{humanizeKey(guidance.evaluation_depth)}</Tag>
          <Tag color={hasWarnings ? 'gold' : 'green'}>
            {hasWarnings ? t('profilePage.warningCount', { count: warnings.length }) : t('profilePage.readyDirectly')}
          </Tag>
          {guidance.large_project_strategy_enabled && <Tag color="orange">{t('profilePage.largeProjectOrch')}</Tag>}
        </Space>
      )}
      style={{
        borderColor: hasWarnings ? '#f59e0b' : undefined,
        background: hasWarnings
          ? 'linear-gradient(135deg, rgba(255,251,235,0.95), rgba(255,255,255,0.98))'
          : 'linear-gradient(135deg, rgba(240,253,250,0.9), rgba(255,255,255,0.98))',
      }}
    >
      <Space direction="vertical" size={14} style={{ width: '100%' }}>
        <Alert
          type={hasWarnings ? 'warning' : 'success'}
          showIcon
          message={getPlanningGuidanceSummaryText(guidance, guidance.summary || t('profilePage.defaultSummary'))}
          description={t('profilePage.guidanceDesc')}
        />

        <Descriptions column={{ xs: 1, md: 2 }} size="small" bordered>
          <Descriptions.Item label={t('profilePage.templateFramework')}>
            {humanizeKey(guidance.template_family)} / {humanizeKey(guidance.framework_family)}
          </Descriptions.Item>
          <Descriptions.Item label={t('profilePage.selectionStrategy')}>
            {humanizeKey(guidance.case_selection_mode)}
          </Descriptions.Item>
          <Descriptions.Item label={t('profilePage.budgetPosture')}>
            {humanizeKey(guidance.budget_class)} · {humanizeKey(guidance.case_budget)}
          </Descriptions.Item>
          <Descriptions.Item label={t('profilePage.speedConfidence')}>
            {humanizeKey(guidance.speed_posture)} · {humanizeKey(guidance.confidence_posture)}
          </Descriptions.Item>
          <Descriptions.Item label={t('profilePage.runner')}>
            {humanizeKey(guidance.validation_lane || guidance.runner_policy_hint)}
          </Descriptions.Item>
          <Descriptions.Item label={t('profilePage.runtime')}>
            {guidance.runtime_image || '-'} · {humanizeKey(guidance.resource_profile)}
          </Descriptions.Item>
          <Descriptions.Item label={t('profilePage.stagesModuleSlices')}>
            {(guidance.stage_count ?? 0)} / {(guidance.module_slice_count ?? 0)}
          </Descriptions.Item>
          <Descriptions.Item label={t('profilePage.partialTruth')}>
            {guidance.allow_partial ? t('profilePage.allowPartialDisclosure') : t('profilePage.failClosedNoEvidence')} ·{' '}
            {guidance.requires_truth_lineage ? t('profilePage.needsTruthLineage') : t('profilePage.noLineageEnforce')}
          </Descriptions.Item>
        </Descriptions>

        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <Card size="small" bodyStyle={{ padding: 12 }}>
              <Text strong>{t('profilePage.authoritativeEvidence')}</Text>
              <div style={{ marginTop: 8 }}>{renderGuidanceTags(guidance.authoritative_evidence_classes)}</div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" bodyStyle={{ padding: 12 }}>
              <Text strong>{t('profilePage.diagnosticEvidence')}</Text>
              <div style={{ marginTop: 8 }}>{renderGuidanceTags(guidance.diagnostic_evidence_classes)}</div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" bodyStyle={{ padding: 12 }}>
              <Text strong>{t('profilePage.deferrableEvidence')}</Text>
              <div style={{ marginTop: 8 }}>{renderGuidanceTags(guidance.deferred_evidence_classes)}</div>
            </Card>
          </Col>
        </Row>

        <Collapse
          items={[
            {
              key: 'fit',
              label: `${t('profilePage.scenarioTradeoffs')} (${(guidance.recommended_for?.length ?? 0) + (guidance.tradeoffs?.length ?? 0)})`,
              children: (
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label={t('profilePage.applicableScenario')}>
                      {renderGuidanceTags(guidance.recommended_for)}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('profilePage.mainTradeoff')}>
                      {renderGuidanceTags(guidance.tradeoffs)}
                    </Descriptions.Item>
                  </Descriptions>
                  {warnings.map((warning) => (
                    <Alert key={warning} type="warning" showIcon message={translatePlanningGuidanceText(warning)} />
                  ))}
                </Space>
              ),
            },
            {
              key: 'commands',
              label: `${t('profilePage.commandCandidates')} (${commandCount})`,
              children: (
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label={t('profilePage.setupCommand')}>
                    {renderGuidanceTags(guidance.setup_command_candidates || guidance.setup_commands)}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('profilePage.testCommand')}>
                    {renderGuidanceTags(guidance.test_command_candidates)}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('profilePage.supportCommand')}>
                    {renderGuidanceTags(guidance.support_command_candidates)}
                  </Descriptions.Item>
                </Descriptions>
              ),
            },
            {
              key: 'next',
              label: `${t('profilePage.suggestedActions')} (${guidance.next_actions?.length ?? 0})`,
              children:
                guidance.next_actions && guidance.next_actions.length > 0 ? (
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    {guidance.next_actions.map((action) => (
                      <Alert key={action} type="info" showIcon message={translatePlanningGuidanceText(action)} />
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">{t('profilePage.noExtraActions')}</Text>
                ),
            },
          ]}
        />
      </Space>
    </Card>
  );
}

export default function ProjectEvalProfilePage() {
  const navigate = useNavigate();
  const { t } = useTranslation('projectEval');
  const { sourceId: routeSourceId } = useParams<{ sourceId?: string }>();
  const [draft, setDraft] = useState<ProjectEvalProfileDraft>(() => loadProjectEvalProfileDraft());
  const [capabilities, setCapabilities] = useState<ProjectEvalCapabilities | null>(null);
  const [creatingRun, setCreatingRun] = useState(false);
  const [source, setSource] = useState<ProjectEvalSource | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceError, setSourceError] = useState<'missing' | 'not_found' | 'load_failed' | null>(null);
  const [defaultsView, setDefaultsView] = useState<ProjectEvalDefaults | null>(null);
  const [defaultsLoading, setDefaultsLoading] = useState(false);
  const [defaultsError, setDefaultsError] = useState(false);
  const hydratedDefaultsSourceId = useRef<string | null>(null);

  const draftSourceId = draft.createdSourceId ?? draft.createdSource?.id ?? null;
  const normalizedRouteSourceId = routeSourceId?.trim() || null;
  const sourceId = normalizedRouteSourceId ?? draftSourceId;
  const detectionInfo = source?.detection_info;

  useEffect(() => {
    void projectEvalService
      .getCapabilities()
      .then((response) => {
        setCapabilities(response as unknown as ProjectEvalCapabilities);
      })
      .catch(() => {
        setCapabilities(null);
      });
  }, []);

  useEffect(() => {
    saveProjectEvalProfileDraft(draft);
  }, [draft]);

  useEffect(() => {
    if (!normalizedRouteSourceId && draftSourceId) {
      navigate(`/project-eval/create/profile/${draftSourceId}`, { replace: true });
    }
  }, [draftSourceId, navigate, normalizedRouteSourceId]);

  useEffect(() => {
    if (!sourceId) {
      setSource(null);
      setSourceError('missing');
      setSourceLoading(false);
      return;
    }

    let cancelled = false;
    setSourceLoading(true);
    setSourceError(null);

    void projectEvalService
      .getSource(sourceId, { silentError: true })
      .then((response) => {
        if (cancelled) {
          return;
        }

        const nextSource = response as unknown as ProjectEvalSource;
        setSource(nextSource);
        setSourceError(null);
        setDraft((current) => {
          if (current.createdSourceId === nextSource.id && current.createdSource?.updated_at === nextSource.updated_at) {
            return current;
          }

          return {
            ...current,
            createdSourceId: nextSource.id,
            createdSource: nextSource,
          };
        });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        const status = (error as { response?: { status?: number } })?.response?.status;
        setSource(null);
        setSourceError(status === 404 ? 'not_found' : 'load_failed');
      })
      .finally(() => {
        if (!cancelled) {
          setSourceLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sourceId]);

  useEffect(() => {
    if (!sourceId) {
      setDefaultsView(null);
      setDefaultsError(false);
      setDefaultsLoading(false);
      hydratedDefaultsSourceId.current = null;
      return;
    }

    let cancelled = false;

    const loadDefaults = async () => {
      setDefaultsLoading(true);
      setDefaultsError(false);

      try {
        const response = await projectEvalService.getEvaluationDefaults(sourceId, { silentError: true });
        if (cancelled) {
          return;
        }

        const nextDefaults = response as unknown as ProjectEvalDefaults;
        setDefaultsView(nextDefaults);

        if (
          nextDefaults.allowed &&
          nextDefaults.defaults &&
          hydratedDefaultsSourceId.current !== nextDefaults.source_id
        ) {
          hydratedDefaultsSourceId.current = nextDefaults.source_id;
          setDraft((current) => ({
            ...current,
            runSettings: mergeRunSettingsWithDefaults(current.runSettings, nextDefaults.defaults!),
          }));
        }
      } catch {
        if (!cancelled) {
          setDefaultsView(null);
          setDefaultsError(true);
        }
      } finally {
        if (!cancelled) {
          setDefaultsLoading(false);
        }
      }
    };

    void loadDefaults();

    return () => {
      cancelled = true;
    };
  }, [sourceId]);

  const availableProjectTypes = useMemo<ProjectType[]>(() => {
    const defaultValues = defaultsView?.options.project_types
      ?.map((value) => normalizeProjectTypeValue(value))
      .filter((value): value is ProjectType => Boolean(value && value !== 'unknown'));
    if (defaultValues && defaultValues.length > 0) {
      return defaultValues;
    }

    const values = capabilities?.project_types
      ?.map((value) => normalizeProjectTypeValue(value))
      .filter((value): value is ProjectType => Boolean(value && value !== 'unknown'));

    return values && values.length > 0 ? values : ['backend', 'frontend', 'llm_app', 'agent'];
  }, [capabilities?.project_types, defaultsView?.options.project_types]);

  const availableRunModes = useMemo<RunMode[]>(() => {
    const defaultValues = defaultsView?.options.run_modes?.filter(
      (value): value is RunMode => value === 'advisory' || value === 'strict',
    );
    if (defaultValues && defaultValues.length > 0) {
      return defaultValues;
    }

    const values = capabilities?.run_modes?.filter((value): value is RunMode => value === 'advisory' || value === 'strict');
    return values && values.length > 0 ? values : ['advisory', 'strict'];
  }, [capabilities?.run_modes, defaultsView?.options.run_modes]);

  const availableScopes = useMemo<EvaluationScope[]>(() => {
    const defaultValues = defaultsView?.options.scopes?.filter(
      (value): value is EvaluationScope => value === 'full' || value === 'delta',
    );
    if (defaultValues && defaultValues.length > 0) {
      return defaultValues;
    }

    const values = capabilities?.scopes?.filter((value): value is EvaluationScope => value === 'full' || value === 'delta');
    return values && values.length > 0 ? values : ['full', 'delta'];
  }, [capabilities?.scopes, defaultsView?.options.scopes]);

  const evaluationDepthOptions =
    defaultsView?.options.evaluation_depths?.length
      ? defaultsView.options.evaluation_depths
      : capabilities?.support_matrix?.evaluation_depths ?? [];
  const projectFamilyOptions =
    defaultsView?.options.project_families?.length
      ? defaultsView.options.project_families
      : capabilities?.support_matrix?.project_families ?? [];
  const frameworkFamilyOptions =
    defaultsView?.options.framework_families?.length
      ? defaultsView.options.framework_families
      : capabilities?.support_matrix?.framework_families ?? [];
  const templateFamilyOptions =
    defaultsView?.options.template_families?.length
      ? defaultsView.options.template_families
      : capabilities?.support_matrix?.template_families ?? [];
  const reportVariantOptions =
    defaultsView?.options.report_variants?.length
      ? defaultsView.options.report_variants
      : capabilities?.report_variants?.length
        ? capabilities.report_variants
        : capabilities?.support_matrix?.report_variants ?? [];

  const enabledDimensions = useMemo(() => {
    return capabilities?.dimensions?.filter((item) => item.enabled) ?? [];
  }, [capabilities?.dimensions]);

  const detectionScoreEntries = useMemo(() => {
    return Object.entries(detectionInfo?.scores ?? {}).sort((left, right) => right[1] - left[1]);
  }, [detectionInfo?.scores]);

  const visibleSignals = useMemo(() => {
    return (detectionInfo?.signals ?? []).slice(0, 12);
  }, [detectionInfo?.signals]);

  const hiddenSignalCount = Math.max((detectionInfo?.signals?.length ?? 0) - visibleSignals.length, 0);
  const maxScore = detectionScoreEntries[0]?.[1] ?? 0;
  const detectedProjectType =
    normalizeProjectTypeValue(source?.detected_type) ?? normalizeProjectTypeValue(detectionInfo?.project_type);
  const detectedFamilyLabel =
    detectedProjectType && detectedProjectType !== 'unknown' ? getProjectTypeLabel(detectedProjectType) : 'Unknown';
  const sourceProjectTypeHint =
    normalizeProjectTypeValue(getMetadataString(source?.metadata, 'project_type_hint')) ?? draft.sourceInput.sourceProjectType;
  const sourceRunModeHint =
    normalizeRunModeHint(getMetadataString(source?.metadata, 'run_mode_hint')) ?? draft.sourceInput.sourceMode;
  const sourceHintDiffers =
    Boolean(sourceProjectTypeHint) &&
    Boolean(detectedProjectType) &&
    detectedProjectType !== 'unknown' &&
    sourceProjectTypeHint !== detectedProjectType;

  const sourceIndexTone = getSourceIndexTone(source?.index?.status);
  const sourceIndexLastUpdated = getSourceIndexLastUpdated(source?.index);
  const hasZipArchiveDiagnostics = Boolean(source?.source_type === 'zip' && (source.zip_object_key || source.archive_sha256));
  const sourceIndexAlertType = !source?.index
    ? 'info'
    : source.index.status === 'ready'
      ? 'success'
      : source.index.status === 'failed'
        ? 'error'
        : 'info';
  const backendDefaults = defaultsView?.defaults;
  const selectedRunMode = draft.runSettings.runMode || backendDefaults?.mode || 'advisory';
  const selectedRunScope = draft.runSettings.runScope || backendDefaults?.scope || 'full';
  const selectedProjectType = draft.runSettings.runProjectType ?? backendDefaults?.project_type;
  const selectedEvaluationDepth = draft.runSettings.evaluationDepth ?? backendDefaults?.evaluation_depth;
  const selectedProjectFamily = draft.runSettings.projectFamily ?? backendDefaults?.project_family;
  const selectedFrameworkFamily = draft.runSettings.frameworkFamily ?? backendDefaults?.framework_family;
  const selectedTemplateFamily = draft.runSettings.templateFamily ?? backendDefaults?.template_family;
  const selectedReportVariants =
    draft.runSettings.reportVariants.length > 0
      ? draft.runSettings.reportVariants
      : backendDefaults?.report_variants ?? [];
  const selectedReportVariant =
    draft.runSettings.reportVariant ?? selectedReportVariants[0] ?? backendDefaults?.report_variant;
  const profileView = defaultsView?.source_profile ?? source?.profile;

  const updateRunSettings = useCallback((patch: RunSettingsPatch) => {
    setDraft((current) => ({
      ...current,
      runSettings: {
        ...current.runSettings,
        ...patch,
      },
    }));
  }, []);

  const handleBackToSource = useCallback(() => {
    navigate('/project-eval/create');
  }, [navigate]);

  const handleResetDraft = useCallback(() => {
    clearProjectEvalProfileDraft();
    setDraft(createDefaultProjectEvalProfileDraft());
    message.success(t('profilePage.draftCleared'));
    navigate('/project-eval/create');
  }, [navigate]);

  const handleCreateRun = useCallback(async () => {
    if (!source) {
      message.warning(t('profilePage.sourceCreateFirst'));
      navigate('/project-eval/create');
      return;
    }

    if (defaultsView && !defaultsView.allowed) {
      message.warning(t('profilePage.policyBlockRecommendation'));
      return;
    }

    if (selectedRunScope === 'delta' && draft.runSettings.changedFiles.length === 0) {
      message.warning(t('profilePage.deltaRequiresFile'));
      return;
    }

    setCreatingRun(true);
    try {
      const response = await projectEvalService.createRun({
        source_id: source.id,
        mode: selectedRunMode,
        project_type: selectedProjectType,
        scope: selectedRunScope,
        evaluation_depth: selectedEvaluationDepth,
        project_family: selectedProjectFamily,
        framework_family: selectedFrameworkFamily,
        template_family: selectedTemplateFamily,
        report_variant: selectedReportVariant,
        report_variants: selectedReportVariants.length > 0 ? selectedReportVariants : undefined,
        candidate_benchmark_ids: backendDefaults?.candidate_benchmark_ids,
        changed_files: selectedRunScope === 'delta' ? draft.runSettings.changedFiles : undefined,
      });

      const run = response as unknown as { id: string };
      clearProjectEvalProfileDraft();
      message.success(t('profilePage.evalStarted'));
      navigate(`/project-eval/${run.id}`);
    } catch (error: unknown) {
      const response = (error as { response?: { data?: { message?: string } } })?.response;
      message.error(response?.data?.message || t('profilePage.createRunFailed'));
    } finally {
      setCreatingRun(false);
    }
  }, [
    backendDefaults?.candidate_benchmark_ids,
    defaultsView,
    draft.runSettings.changedFiles,
    navigate,
    selectedEvaluationDepth,
    selectedFrameworkFamily,
    selectedProjectFamily,
    selectedProjectType,
    selectedReportVariant,
    selectedReportVariants,
    selectedRunMode,
    selectedRunScope,
    selectedTemplateFamily,
    source,
  ]);

  const executionPreview = defaultsView?.preview?.execution_profile;
  const budgetPreview = defaultsView?.preview?.budget_profile;
  const evidencePreview = defaultsView?.preview?.evidence_plan;
  const largeProjectPreview = defaultsView?.preview?.large_project_strategy;
  const runnerPreview = defaultsView?.preview?.runner_profile;
  const planningGuidance = defaultsView?.preview?.planning_guidance;
  const orchestrationContract = defaultsView?.preview?.agent_orchestration_contract;
  const supportPosturePreview = getMetadataRecord(orchestrationContract, 'support_posture');
  const objectivePreview = getMetadataRecord(orchestrationContract, 'objective');
  const phasesPreview = getMetadataRecordList(orchestrationContract, 'phases');
  const selfCheckPreview = getMetadataRecordList(orchestrationContract, 'self_check_criteria');
  const deliverableExpectationsPreview = getMetadataRecordList(orchestrationContract, 'deliverable_expectations');
  const visibleSelfChecks = selfCheckPreview.filter((item) => getMetadataBoolean(item, 'required') !== false).slice(0, 4);
  const visiblePhases = phasesPreview.slice(0, 6);
  const runnerDepthSemantics = getMetadataRecord(runnerPreview, 'depth_semantics');
  const runnerPreviewSummary =
    compactStringList([
      getMetadataString(runnerPreview, 'validation_lane'),
      getMetadataString(runnerPreview, 'test_selection_policy'),
      getMetadataString(runnerDepthSemantics, 'lane_scope'),
    ]).join(' / ') || '-';
  const orchestrationPreviewSummary =
    compactStringList([
      getMetadataString(orchestrationContract, 'purpose'),
      getMetadataString(objectivePreview, 'accurate_result_policy'),
    ]).join(' / ') || '-';
  const supportPostureTags = compactStringList([
    getMetadataBoolean(supportPosturePreview, 'large_project_orchestration') ? 'large project aware' : undefined,
    getMetadataBoolean(supportPosturePreview, 'module_slicing_active') ? 'module slicing' : undefined,
    getMetadataBoolean(supportPosturePreview, 'staged_execution_active') ? 'staged execution' : undefined,
    getMetadataBoolean(supportPosturePreview, 'requires_truth_lineage') ? 'truth lineage required' : undefined,
    getMetadataBoolean(supportPosturePreview, 'requires_skipped_disclosure') ? 'skip disclosure' : undefined,
    getMetadataBoolean(supportPosturePreview, 'requires_deferred_disclosure') ? 'defer disclosure' : undefined,
  ]);
  const executionPreviewSummary =
    compactStringList([
      getMetadataString(executionPreview, 'orchestration_mode'),
      getMetadataString(executionPreview, 'case_selection_mode'),
      getMetadataString(executionPreview, 'runner_policy_hint'),
    ]).join(' / ') || '-';
  const budgetPreviewSummary =
    compactStringList([
      getMetadataString(budgetPreview, 'budget_class'),
      getMetadataString(budgetPreview, 'case_budget'),
      getMetadataString(largeProjectPreview, 'partial_result_semantics'),
    ]).join(' / ') || '-';
  const evidencePreviewSummary =
    compactStringList([
      getMetadataString(evidencePreview, 'partial_result_policy'),
      getMetadataString(largeProjectPreview, 'sampling_policy'),
      getMetadataString(largeProjectPreview, 'coverage_floor_policy'),
    ]).join(' / ') || '-';
  const contractRawPreview = orchestrationContract
    ? JSON.stringify(orchestrationContract, null, 2)
    : '';

  const profileAlertType = detectionInfo?.error
    ? 'warning'
    : detectedProjectType && detectedProjectType !== 'unknown'
      ? 'success'
      : 'info';

  const profileAlertMessage = detectionInfo?.error
    ? t('profilePage.profilingFallback')
    : detectedProjectType && detectedProjectType !== 'unknown'
      ? t('profilePage.detectedAs', { family: detectedFamilyLabel })
      : t('profilePage.lowConfidence');

  const profileAlertDescription = detectionInfo?.error
    ? t('profilePage.errorWithFallback', { error: detectionInfo.error })
    : t('profilePage.profileSourceNote');

  const missingSourceMessage =
    sourceError === 'not_found'
      ? t('profilePage.sourceProfileUnavailable')
      : sourceError === 'load_failed'
        ? t('profilePage.cannotLoadProfile')
        : t('profilePage.needSourceId');

  const missingSourceDescription =
    sourceError === 'not_found'
      ? t('profilePage.sourceNotInOrg')
      : sourceError === 'load_failed'
        ? t('profilePage.retryOrRefresh')
        : t('profilePage.startFromSourceFirst');

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <PageHeader
        title={t('profilePage.viewProjectProfileTitle')}
        description={t('profilePage.viewProjectProfileDesc')}
        breadcrumb={[
          { title: t('common.dashboard') },
          { title: t('title') },
          { title: t('create.breadcrumb') },
          { title: t('profilePage.breadcrumb') },
        ]}
        extra={(
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBackToSource}>
              {t('profilePage.backToSourceSettings')}
            </Button>
            <Button onClick={handleResetDraft}>{t('profilePage.resetDraft')}</Button>
          </Space>
        )}
      />

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Space wrap>
            <Tag color="blue">{t('profilePage.profileReview')}</Tag>
            <Tag color="green">{t('profilePage.finishBeforeStart')}</Tag>
            <Tag>{source ? t('profilePage.sourceLoaded') : sourceLoading ? t('profilePage.sourceLoading') : t('profilePage.missingSource')}</Tag>
          </Space>
          <Steps
            current={1}
            items={[
              { title: t('profilePage.step1Title'), description: t('profilePage.step1Desc') },
              { title: t('profilePage.step2Title'), description: t('profilePage.step2Desc') },
              { title: t('profilePage.step3Title'), description: t('profilePage.step3Desc') },
            ]}
          />
        </Space>
      </Card>

      {sourceLoading ? (
        <Card loading />
      ) : !source ? (
        <Card>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Alert
              type={sourceError === 'load_failed' ? 'warning' : 'info'}
              showIcon
              message={missingSourceMessage}
              description={t('profilePage.loadsBackendDesc')}
            />
            <Empty description={missingSourceDescription}>
              <Button type="primary" onClick={handleBackToSource}>
                {t('profilePage.goToSourceSettings')}
              </Button>
            </Empty>
          </Space>
        </Card>
      ) : (
        <>
          <Alert
            type={profileAlertType}
            showIcon
            style={{ marginBottom: 16 }}
            message={profileAlertMessage}
            description={profileAlertDescription}
          />

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Card title={t('profilePage.platformUnderstanding')}>
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Descriptions column={1} bordered size="small">
                      <Descriptions.Item label={t('profilePage.projectName')}>{source.name}</Descriptions.Item>
                      <Descriptions.Item label={t('profilePage.sourceId')}>{source.id}</Descriptions.Item>
                      <Descriptions.Item label={t('profilePage.sourceType')}>{getSourceTypeLabel(source.source_type)}</Descriptions.Item>
                      <Descriptions.Item label={t('profilePage.detectedProjectType')}>{detectedFamilyLabel}</Descriptions.Item>
                      <Descriptions.Item label={t('profilePage.confidence')}>
                        <Tag color={getConfidenceColor(detectionInfo?.confidence)}>
                          {detectionInfo?.confidence ? humanizeKey(detectionInfo.confidence) : t('profilePage.unknown')}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label={t('profilePage.detectionEngine')}>
                        {detectionInfo?.engine ? humanizeKey(detectionInfo.engine) : t('profilePage.rulesV1')}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('profilePage.projectTypeHint')}>
                        {sourceProjectTypeHint ? getProjectTypeLabel(sourceProjectTypeHint) : t('profilePage.notProvided')}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('profilePage.preferredRunModeHint')}>
                        {sourceRunModeHint ? getRunModeLabel(sourceRunModeHint) : t('profilePage.notProvided')}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('profilePage.hintApplied')}>{detectionInfo?.hint_used ? t('yes') : t('no')}</Descriptions.Item>
                      <Descriptions.Item label={t('profilePage.createdAt')}>{formatDateTime(source.created_at)}</Descriptions.Item>
                      {source.source_type === 'git' ? (
                        <>
                          <Descriptions.Item label={t('profilePage.gitUrl')}>{source.git_url || '-'}</Descriptions.Item>
                          <Descriptions.Item label={t('profilePage.branch')}>{source.branch || '-'}</Descriptions.Item>
                          <Descriptions.Item label={t('profilePage.commit')}>{source.commit_sha || '-'}</Descriptions.Item>
                        </>
                      ) : (
                        <>
                          <Descriptions.Item label={t('profilePage.zipSnapshotIdentity')}>
                            <Space direction="vertical" size={2}>
                              <Text>{t('profilePage.canonicalZipSnapshot')}</Text>
                              <Text type="secondary">
                                {t('profilePage.zipObjectKeyHidden')}
                              </Text>
                            </Space>
                          </Descriptions.Item>
                          <Descriptions.Item label={t('profilePage.zipIndexStatus')}>
                            <Tag color={sourceIndexTone.color}>{sourceIndexTone.label}</Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label={t('profilePage.indexedFileCount')}>
                            {source.index ? source.index.file_count : '-'}
                          </Descriptions.Item>
                          <Descriptions.Item label={t('profilePage.indexedChunkCount')}>
                            {source.index ? source.index.chunk_count : '-'}
                          </Descriptions.Item>
                          <Descriptions.Item label={t('profilePage.indexUpdatedAt')}>
                            {sourceIndexLastUpdated ? formatDateTime(sourceIndexLastUpdated) : '-'}
                          </Descriptions.Item>
                        </>
                      )}
                    </Descriptions>

                    {source.source_type === 'zip' && (
                      <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <Alert
                          type={sourceIndexAlertType}
                          showIcon
                          message={t('profilePage.zipIndexStatusMsg', { status: sourceIndexTone.label })}
                          description={sourceIndexLastUpdated
                            ? t('profilePage.indexSummaryUpdated', {
                                summary: getSourceIndexSummary(source.index),
                                time: formatDateTime(sourceIndexLastUpdated),
                              })
                            : getSourceIndexSummary(source.index)}
                        />
                        {hasZipArchiveDiagnostics && (
                          <Collapse
                            items={[
                              {
                                key: 'zip-archive-diagnostics',
                                label: t('profilePage.archiveDiagnostics'),
                                children: (
                                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                    <Alert
                                      type="info"
                                      showIcon
                                      message={t('profilePage.compatibilityDetails')}
                                      description={t('profilePage.compatibilityDetailsDesc')}
                                    />
                                    <Descriptions column={1} bordered size="small">
                                      <Descriptions.Item label={t('profilePage.zipObjectKey')}>{source.zip_object_key || '-'}</Descriptions.Item>
                                      <Descriptions.Item label={t('profilePage.archiveSha256')}>{source.archive_sha256 || '-'}</Descriptions.Item>
                                    </Descriptions>
                                  </Space>
                                ),
                              },
                            ]}
                          />
                        )}
                      </Space>
                    )}

                    {sourceHintDiffers && (
                      <Alert
                        type="warning"
                        showIcon
                        message={t('profilePage.hintMismatch')}
                        description={t('profilePage.hintMismatchDesc', { hint: getProjectTypeLabel(sourceProjectTypeHint!), detected: detectedFamilyLabel })}
                      />
                    )}
                  </Space>
                </Card>

                <Card title={t('profilePage.signalsBehindDetection')}>
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Paragraph style={{ marginBottom: 0 }}>
                      {t('profilePage.lightweightRuleEngineNote')}
                    </Paragraph>

                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <Space direction="vertical" size={12} style={{ width: '100%' }}>
                          <Title level={5} style={{ margin: 0 }}>
                            {t('profilePage.typeScoreBoard')}
                          </Title>
                          {detectionScoreEntries.length > 0 ? (
                            detectionScoreEntries.map(([family, score]) => (
                              <div key={family}>
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    gap: 12,
                                    marginBottom: 6,
                                  }}
                                >
                                  <Text strong>{getProjectTypeLabel(family)}</Text>
                                  <Text type="secondary">{score.toFixed(1)}</Text>
                                </div>
                                <Progress
                                  percent={getScorePercent(score, maxScore)}
                                  showInfo={false}
                                  strokeColor={family === detectedProjectType ? '#1677ff' : undefined}
                                />
                              </div>
                            ))
                          ) : (
                            <Text type="secondary">{t('profilePage.noTypeScoreBreakdown')}</Text>
                          )}
                        </Space>
                      </Col>

                      <Col xs={24} md={12}>
                        <Space direction="vertical" size={12} style={{ width: '100%' }}>
                          <Title level={5} style={{ margin: 0 }}>
                            {t('profilePage.observedSignals')}
                          </Title>
                          {visibleSignals.length > 0 ? (
                            <Space wrap>
                              {visibleSignals.map((signal) => (
                                <Tag key={signal}>{signal}</Tag>
                              ))}
                            </Space>
                          ) : (
                            <Text type="secondary">{t('profilePage.noDetectorSignals')}</Text>
                          )}
                          {hiddenSignalCount > 0 && (
                            <Text type="secondary">{t('profilePage.hiddenSignalCount', { count: hiddenSignalCount })}</Text>
                          )}
                        </Space>
                      </Col>
                    </Row>
                  </Space>
                </Card>

                <Card title={t('profilePage.recommendedEvalPlan')} loading={defaultsLoading && !defaultsView}>
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    {defaultsError ? (
                      <Alert
                        type="warning"
                        showIcon
                        message={t('profilePage.loadRecommendFailed')}
                        description={t('profilePage.loadRecommendFailedDesc')}
                      />
                    ) : !defaultsView ? (
                      <Text type="secondary">{t('profilePage.waitingSourceRecommendation')}</Text>
                    ) : (
                      <>
                        {!defaultsView.allowed && (
                          <Alert
                            type="error"
                            showIcon
                            message={t('profilePage.policyBlockCurrent')}
                            description={(
                              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                {(defaultsView.policy_blocks ?? []).map((block) => (
                                  <Text key={`${block.option_type}:${block.value}`}>
                                    {humanizeKey(block.option_type)}={block.value}: {block.message || humanizeKey(block.reason)}
                                  </Text>
                                ))}
                              </Space>
                            )}
                          />
                        )}

                        {defaultsView.defaults ? (
                          <Descriptions column={1} bordered size="small">
                            <Descriptions.Item label={t('profilePage.evalDepth')}>
                              <Tag color="blue">{selectedEvaluationDepth ? humanizeKey(selectedEvaluationDepth) : '-'}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label={t('profilePage.projectFamily')}>
                              {getCapabilityLabel(defaultsView.support?.project_family, selectedProjectFamily)}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('profilePage.frameworkFamily')}>
                              {getCapabilityLabel(defaultsView.support?.framework_family, selectedFrameworkFamily)}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('profilePage.templateFamily')}>
                              {getCapabilityLabel(defaultsView.support?.template_family, selectedTemplateFamily)}
                            </Descriptions.Item>
                            <Descriptions.Item label={t('profilePage.defaultScope')}>{getScopeLabel(selectedRunScope)}</Descriptions.Item>
                            <Descriptions.Item label={t('profilePage.reportView')}>
                              <Space wrap>
                                {selectedReportVariants.length > 0 ? (
                                  selectedReportVariants.map((value) => <Tag key={value}>{humanizeKey(value)}</Tag>)
                                ) : (
                                  <Text type="secondary">{t('profilePage.notSpecified')}</Text>
                                )}
                              </Space>
                            </Descriptions.Item>
                          </Descriptions>
                        ) : (
                          <Alert
                            type="warning"
                            showIcon
                            message={t('profilePage.noSafeDefaultParams')}
                            description={t('profilePage.noSafeDefaultParamsDesc')}
                          />
                        )}

                        {profileView && (
                          <Space wrap>
                            <Tag color={getConfidenceColor(profileView.confidence)}>
                              {profileView.confidence ? humanizeKey(profileView.confidence) : t('profilePage.unknown')} {t('profilePage.confidenceSuffix')}
                            </Tag>
                            <Tag>{profileView.scale_profile ? humanizeKey(profileView.scale_profile) : t('profilePage.scaleUnknown')}</Tag>
                            <Tag>{t('profilePage.languageCount', { count: profileView.languages?.length ?? 0 })}</Tag>
                            <Tag>{t('profilePage.frameworkCount', { count: profileView.frameworks?.length ?? 0 })}</Tag>
                            <Tag>{t('profilePage.riskHotspotCount', { count: profileView.risk_hotspots?.length ?? 0 })}</Tag>
                          </Space>
                        )}

                        {defaultsView.support && (
                          <>
                            <Divider style={{ margin: '4px 0' }} />
                            <Space direction="vertical" size={10} style={{ width: '100%' }}>
                              <Space wrap>
                                <Tag>{defaultsView.support.matrix_version}</Tag>
                                <Tag color={getSupportStatusColor(defaultsView.support.status)}>
                                  {defaultsView.support.status ? humanizeKey(defaultsView.support.status) : t('profilePage.supportUnknown')}
                                </Tag>
                                <Tag color={getFreshnessColor(defaultsView.support.freshness)}>
                                  {defaultsView.support.freshness ? humanizeKey(defaultsView.support.freshness) : t('profilePage.freshnessUnknown')}
                                </Tag>
                                {defaultsView.support.maturity && <Tag>{humanizeKey(defaultsView.support.maturity)}</Tag>}
                              </Space>

                              {defaultsView.support.acceptance && (
                                <Text type="secondary">
                                  {t('profilePage.acceptanceEvidence', {
                                    evidence: defaultsView.support.acceptance.evidence_count,
                                    samples: defaultsView.support.acceptance.sample_count,
                                    gaps: defaultsView.support.acceptance.known_gap_count,
                                  })}
                                </Text>
                              )}

                              {(defaultsView.support.known_gaps?.length ?? 0) > 0 && (
                                <Space direction="vertical" size={4}>
                                  {defaultsView.support.known_gaps?.slice(0, 3).map((gap) => (
                                    <Text key={gap} type="secondary">
                                      - {gap}
                                    </Text>
                                  ))}
                                </Space>
                              )}
                            </Space>
                          </>
                        )}

                        {defaultsView.preview && (
                          <>
                            <Divider style={{ margin: '4px 0' }} />
                            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                              <Descriptions column={1} size="small">
                                <Descriptions.Item label={t('profilePage.executionMethod')}>{executionPreviewSummary}</Descriptions.Item>
                                <Descriptions.Item label={t('profilePage.budgetPosture')}>{budgetPreviewSummary}</Descriptions.Item>
                                <Descriptions.Item label={t('profilePage.evidenceStrategy')}>{evidencePreviewSummary}</Descriptions.Item>
                                <Descriptions.Item label={t('profilePage.runnerProfile')}>{runnerPreviewSummary}</Descriptions.Item>
                                <Descriptions.Item label={t('profilePage.agentContract')}>{orchestrationPreviewSummary}</Descriptions.Item>
                              </Descriptions>

                              {planningGuidance && (
                                <PlanningGuidancePreviewCard guidance={planningGuidance} />
                              )}

                              {orchestrationContract && (
                                <Card size="small" title={t('profilePage.agentExecutionContract')}>
                                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                    <Alert
                                      type="info"
                                      showIcon
                                      message={t('profilePage.contractGenerated')}
                                      description={t('profilePage.contractGeneratedDesc')}
                                    />

                                    {supportPostureTags.length > 0 && (
                                      <Space wrap>
                                        {supportPostureTags.map((tag) => (
                                          <Tag key={tag} color="blue">{tag}</Tag>
                                        ))}
                                      </Space>
                                    )}

                                    <Descriptions column={1} size="small" bordered>
                                      <Descriptions.Item label={t('profilePage.contractVersion')}>
                                        {getMetadataString(orchestrationContract, 'contract_version') || '-'}
                                      </Descriptions.Item>
                                      <Descriptions.Item label={t('profilePage.validationLane')}>
                                        {getMetadataString(supportPosturePreview, 'validation_lane') || '-'}
                                      </Descriptions.Item>
                                      <Descriptions.Item label={t('profilePage.partialResultPolicy')}>
                                        {getMetadataString(supportPosturePreview, 'partial_result_policy') || '-'}
                                      </Descriptions.Item>
                                      <Descriptions.Item label={t('profilePage.runnerTimeoutMultiplier')}>
                                        {getMetadataNumber(runnerDepthSemantics, 'timeout_multiplier') ?? '-'}
                                      </Descriptions.Item>
                                    </Descriptions>

                                    <Collapse
                                      items={[
                                        {
                                          key: 'agent-orchestration-details',
                                          label: t('profilePage.viewStagesAndContract'),
                                          children: (
                                            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                              {visiblePhases.length > 0 && (
                                                <Steps
                                                  direction="vertical"
                                                  size="small"
                                                  current={0}
                                                  items={visiblePhases.map((phase) => {
                                                    const order = getMetadataNumber(phase, 'order');
                                                    const inputs = getMetadataStringList(phase, 'inputs');
                                                    return {
                                                      title: `${order ? `${order}. ` : ''}${getMetadataString(phase, 'name') || getMetadataString(phase, 'id') || 'Phase'}`,
                                                      description: (
                                                        <Space direction="vertical" size={4}>
                                                          <Text type="secondary">
                                                            {getMetadataString(phase, 'goal') || t('profilePage.waitingPhaseGoal')}
                                                          </Text>
                                                          {inputs.length > 0 && (
                                                            <Text type="secondary">
                                                              Inputs: {inputs.slice(0, 4).join(', ')}
                                                              {inputs.length > 4 ? ` +${inputs.length - 4}` : ''}
                                                            </Text>
                                                          )}
                                                        </Space>
                                                      ),
                                                    };
                                                  })}
                                                />
                                              )}

                                              {visibleSelfChecks.length > 0 && (
                                                <div>
                                                  <Text strong>{t('profilePage.keySelfChecks')}</Text>
                                                  <Space direction="vertical" size={8} style={{ width: '100%', marginTop: 8 }}>
                                                    {visibleSelfChecks.map((check) => (
                                                      <Alert
                                                        key={getMetadataString(check, 'id') || getMetadataString(check, 'expectation')}
                                                        type={getMetadataString(check, 'severity') === 'critical' ? 'error' : 'warning'}
                                                        showIcon
                                                        message={getMetadataString(check, 'id') || 'self_check'}
                                                        description={getMetadataString(check, 'failure_policy') || getMetadataString(check, 'expectation') || t('profilePage.selfCheckNoDesc')}
                                                      />
                                                    ))}
                                                  </Space>
                                                </div>
                                              )}

                                              {deliverableExpectationsPreview.length > 0 && (
                                                <div>
                                                  <Text strong>{t('profilePage.deliverables')}</Text>
                                                  <Space wrap style={{ marginTop: 8 }}>
                                                    {deliverableExpectationsPreview.slice(0, 6).map((item) => (
                                                      <Tag key={getMetadataString(item, 'id') || getMetadataString(item, 'name')}>
                                                        {getMetadataString(item, 'name') || getMetadataString(item, 'id') || 'deliverable'}
                                                      </Tag>
                                                    ))}
                                                  </Space>
                                                </div>
                                              )}

                                              <pre
                                                style={{
                                                  margin: 0,
                                                  maxHeight: 260,
                                                  overflow: 'auto',
                                                  padding: 12,
                                                  borderRadius: 8,
                                                  background: '#0f172a',
                                                  color: '#e2e8f0',
                                                  whiteSpace: 'pre-wrap',
                                                }}
                                              >
                                                {contractRawPreview}
                                              </pre>
                                            </Space>
                                          ),
                                        },
                                      ]}
                                    />
                                  </Space>
                                </Card>
                              )}
                            </Space>
                          </>
                        )}

                        {(defaultsView.notes?.length ?? 0) > 0 && (
                          <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            {defaultsView.notes?.map((note) => (
                              <Alert
                                key={note.id}
                                type={getNoteAlertType(note.severity)}
                                showIcon
                                message={note.message}
                              />
                            ))}
                          </Space>
                        )}
                      </>
                    )}
                  </Space>
                </Card>

                <Card title={t('profilePage.startSettings')}>
                  <Space direction="vertical" size={20} style={{ width: '100%' }}>
                    <div>
                      <Title level={5}>{t('profilePage.recommendedParams')}</Title>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                          <Text strong>{t('profilePage.evalDepth')}</Text>
                          <Select
                            value={selectedEvaluationDepth}
                            placeholder={t('profilePage.selectEvalDepth')}
                            style={{ width: '100%', marginTop: 8 }}
                            options={evaluationDepthOptions.map((item) => ({
                              value: item.id,
                              label: `${item.display_name || humanizeKey(item.id)} · ${humanizeKey(item.budget_class)}`,
                            }))}
                            onChange={(value) => updateRunSettings({ evaluationDepth: value })}
                          />
                        </Col>
                        <Col xs={24} md={12}>
                          <Text strong>{t('profilePage.projectFamily')}</Text>
                          <Select
                            value={selectedProjectFamily}
                            placeholder={t('profilePage.selectProjectFamily')}
                            style={{ width: '100%', marginTop: 8 }}
                            options={projectFamilyOptions.map((item) => ({
                              value: item.id,
                              label: item.display_name || humanizeKey(item.id),
                            }))}
                            onChange={(value) => updateRunSettings({ projectFamily: value })}
                          />
                        </Col>
                        <Col xs={24} md={12}>
                          <Text strong>{t('profilePage.frameworkFamily')}</Text>
                          <Select
                            value={selectedFrameworkFamily}
                            placeholder={t('profilePage.selectFrameworkFamily')}
                            style={{ width: '100%', marginTop: 8 }}
                            options={frameworkFamilyOptions.map((item) => ({
                              value: item.id,
                              label: item.display_name || humanizeKey(item.id),
                            }))}
                            onChange={(value) => updateRunSettings({ frameworkFamily: value })}
                          />
                        </Col>
                        <Col xs={24} md={12}>
                          <Text strong>{t('profilePage.templateFamily')}</Text>
                          <Select
                            value={selectedTemplateFamily}
                            placeholder={t('profilePage.selectTemplateFamily')}
                            style={{ width: '100%', marginTop: 8 }}
                            options={templateFamilyOptions.map((item) => ({
                              value: item.id,
                              label: item.display_name || humanizeKey(item.id),
                            }))}
                            onChange={(value) => updateRunSettings({ templateFamily: value })}
                          />
                        </Col>
                        <Col xs={24}>
                          <Text strong>{t('profilePage.reportView')}</Text>
                          <Select
                            mode="multiple"
                            value={selectedReportVariants}
                            placeholder={t('profilePage.selectReportView')}
                            style={{ width: '100%', marginTop: 8 }}
                            options={reportVariantOptions.map((item) => ({
                              value: item.id,
                              label: item.display_name || humanizeKey(item.id),
                            }))}
                            onChange={(value) => updateRunSettings({
                              reportVariant: value[0],
                              reportVariants: value,
                            })}
                          />
                          <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                            {t('profilePage.reportViewFrozenNote')}
                          </Text>
                        </Col>
                      </Row>
                    </div>

                    <div>
                      <Title level={5}>{t('profilePage.recommendedRunMode')}</Title>
                      <Row gutter={[16, 16]}>
                        {RUN_MODE_RECOMMENDATIONS.filter((item) => availableRunModes.includes(item.value)).map((item) => (
                          <Col xs={24} md={12} key={item.value}>
                            <RunRecommendationCard
                              title={item.title}
                              description={item.description}
                              bullets={item.bullets}
                              footnote={item.footnote}
                              recommended={item.recommended}
                              selected={selectedRunMode === item.value}
                              onClick={() => updateRunSettings({ runMode: item.value })}
                            />
                          </Col>
                        ))}
                      </Row>
                    </div>

                    <div>
                      <Title level={5}>{t('profilePage.evalScope')}</Title>
                      <Row gutter={[16, 16]}>
                        {SCOPE_RECOMMENDATIONS.filter((item) => availableScopes.includes(item.value)).map((item) => (
                          <Col xs={24} md={12} key={item.value}>
                            <RunRecommendationCard
                              title={item.title}
                              description={item.description}
                              bullets={item.bullets}
                              footnote={item.footnote}
                              recommended={item.recommended}
                              selected={selectedRunScope === item.value}
                              onClick={() => updateRunSettings({ runScope: item.value })}
                            />
                          </Col>
                        ))}
                      </Row>
                    </div>

                    {selectedRunScope === 'delta' && (
                      <div>
                        <Text strong>{t('profilePage.changedFiles')}</Text>
                        <Select
                          mode="tags"
                          value={draft.runSettings.changedFiles}
                          placeholder={t('profilePage.addChangedFilePath')}
                          style={{ width: '100%', marginTop: 8 }}
                          onChange={(value) => updateRunSettings({ changedFiles: value })}
                        />
                        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                          {t('profilePage.deltaManualNote')}
                        </Text>
                      </div>
                    )}

                    <div>
                      <Text strong>{t('profilePage.projectTypeOverride')}</Text>
                      <Select
                        allowClear
                        value={draft.runSettings.runProjectType}
                        placeholder={selectedProjectType ? getProjectTypeLabel(selectedProjectType) : t('profilePage.defaultUseDetection')}
                        style={{ width: '100%', marginTop: 8 }}
                        options={availableProjectTypes.map((value) => ({ value, label: getProjectTypeLabel(value) }))}
                        onChange={(value) => updateRunSettings({ runProjectType: value as ProjectType | undefined })}
                      />
                      <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                        {t('profilePage.overrideEmptyNote')}
                      </Text>
                    </div>

                    <Space wrap>
                      <Button icon={<ArrowLeftOutlined />} onClick={handleBackToSource}>
                        {t('profilePage.backToSourceSettings')}
                      </Button>
                      <Button type="primary" icon={<RocketOutlined />} loading={creatingRun} onClick={handleCreateRun}>
                        {t('profilePage.startEvaluation')}
                      </Button>
                    </Space>
                  </Space>
                </Card>
              </Space>
            </Col>

            <Col xs={24} lg={8}>
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Card title={t('profilePage.workspaceSupport')}>
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <div>
                      <Text strong>{t('profilePage.projectType')}</Text>
                      <div style={{ marginTop: 8 }}>
                        {availableProjectTypes.map((value) => (
                          <Tag key={value}>{getProjectTypeLabel(value)}</Tag>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Text strong>{t('profilePage.runModes')}</Text>
                      <div style={{ marginTop: 8 }}>
                        {availableRunModes.map((value) => (
                          <Tag key={value}>{getRunModeLabel(value)}</Tag>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Text strong>{t('profilePage.scopes')}</Text>
                      <div style={{ marginTop: 8 }}>
                        {availableScopes.map((value) => (
                          <Tag key={value}>{getScopeLabel(value)}</Tag>
                        ))}
                      </div>
                    </div>
                    {enabledDimensions.length > 0 && (
                      <div>
                        <Text strong>{t('profilePage.enabledDimensions')}</Text>
                        <div style={{ marginTop: 8 }}>
                          {enabledDimensions.map((item) => (
                            <div key={item.name} style={{ marginBottom: 6 }}>
                              <Tag>{humanizeKey(item.name)}</Tag>
                              <Text type="secondary">
                                {t('profilePage.dimensionWeight', { weight: (item.effective_weight * 100).toFixed(0), costClass: item.cost_class })}
                              </Text>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Space>
                </Card>

                {defaultsView?.support && (
                  <Card title={t('profilePage.supportAcceptance')}>
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <Space wrap>
                        <Tag color={getSupportStatusColor(defaultsView.support.status)}>
                          {defaultsView.support.status ? humanizeKey(defaultsView.support.status) : t('profilePage.supportUnknown')}
                        </Tag>
                        <Tag color={getFreshnessColor(defaultsView.support.freshness)}>
                          {defaultsView.support.freshness ? humanizeKey(defaultsView.support.freshness) : t('profilePage.freshnessUnknown')}
                        </Tag>
                        {defaultsView.support.maturity && <Tag>{humanizeKey(defaultsView.support.maturity)}</Tag>}
                      </Space>

                      {defaultsView.support.representative_samples && defaultsView.support.representative_samples.length > 0 && (
                        <div>
                          <Text strong>{t('profilePage.representativeSamples')}</Text>
                          <Space direction="vertical" size={4} style={{ width: '100%', marginTop: 8 }}>
                            {defaultsView.support.representative_samples.slice(0, 3).map((sample) => (
                              <Text key={sample.id} type="secondary">
                                - {sample.name} · {humanizeKey(sample.status)}
                              </Text>
                            ))}
                          </Space>
                        </div>
                      )}

                      {defaultsView.support.evidence_refs && defaultsView.support.evidence_refs.length > 0 && (
                        <Text type="secondary">
                          {t('profilePage.evidenceRefs', { refs: defaultsView.support.evidence_refs.slice(0, 3).join(', ') })}
                        </Text>
                      )}

                      {(defaultsView.support.limitations?.length ?? 0) > 0 && (
                        <>
                          <Divider style={{ margin: '4px 0' }} />
                          <Space direction="vertical" size={4}>
                            {defaultsView.support.limitations?.slice(0, 3).map((limitation) => (
                              <Text key={limitation} type="secondary">
                                - {limitation}
                              </Text>
                            ))}
                          </Space>
                        </>
                      )}
                    </Space>
                  </Card>
                )}

                <Card title={t('profilePage.currentBrowserDraft')}>
                  <Space direction="vertical" size={10} style={{ width: '100%' }}>
                    <Text>- Run mode: {getRunModeLabel(selectedRunMode)}</Text>
                    <Text>- Scope: {getScopeLabel(selectedRunScope)}</Text>
                    <Text>{t('profilePage.depthLine', { value: selectedEvaluationDepth ? humanizeKey(selectedEvaluationDepth) : '-' })}</Text>
                    <Text>
                      - {t('profilePage.defaultProjectType')}{' '}
                      {selectedProjectType
                        ? getProjectTypeLabel(selectedProjectType)
                        : detectedFamilyLabel}
                    </Text>
                    <Text type="secondary">
                      {t('profilePage.draftPreservedNote')}
                    </Text>
                  </Space>
                </Card>

                <Card title={t('profilePage.whatWeDontKnow')}>
                  <Space direction="vertical" size={10} style={{ width: '100%' }}>
                    <Text>{t('profilePage.gapMultiModule')}</Text>
                    <Text>{t('profilePage.gapDependencyGraph')}</Text>
                    <Text>{t('profilePage.gapSupportMatrix')}</Text>
                    <Text>{t('profilePage.gapMonorepoDepth')}</Text>
                  </Space>
                </Card>
              </Space>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}

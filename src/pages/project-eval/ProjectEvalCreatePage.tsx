import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Input,
  Radio,
  Row,
  Select,
  Space,
  Steps,
  Tag,
  Typography,
  message,
} from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common';
import ProjectEvalSourceReuseBrowser from '@/components/project-eval/ProjectEvalSourceReuseBrowser';
import ProjectEvalZipUploadPanel from '@/components/project-eval/ProjectEvalZipUploadPanel';
import {
  clearProjectEvalProfileDraft,
  createDefaultProjectEvalProfileDraft,
  loadProjectEvalProfileDraft,
  normalizeProjectTypeValue,
  saveProjectEvalProfileDraft,
  type ProjectEvalProfileDraft,
  type ProjectEvalSourceInputDraft,
} from '@/components/project-eval/profileDraft';
import {
  formatDateTime,
  getProjectTypeLabel,
  getRunModeLabel,
  getScopeLabel,
  humanizeKey,
  ZIP_SOURCE_MAINLINE_GAP_TEXT_KEY,
} from '@/components/project-eval/helpers';
import { projectEvalService } from '@/services/project-eval';
import type {
  EvaluationScope,
  ProjectEvalCapabilities,
  ProjectEvalSource,
  ProjectEvalSourceListItem,
  ProjectType,
  RunMode,
  SourceType,
} from '@/types/api/project-eval';

const { Text, Title } = Typography;

type SourceInputPatch = Partial<ProjectEvalSourceInputDraft>;
type SourceEntryMode = 'reuse' | 'create';

export default function ProjectEvalCreatePage() {
  const navigate = useNavigate();
  const { t } = useTranslation('projectEval');
  const [draft, setDraft] = useState<ProjectEvalProfileDraft>(() => loadProjectEvalProfileDraft());
  const [capabilities, setCapabilities] = useState<ProjectEvalCapabilities | null>(null);
  const [creatingSource, setCreatingSource] = useState(false);
  const [sourceEntryMode, setSourceEntryMode] = useState<SourceEntryMode>(() => {
    const currentDraft = loadProjectEvalProfileDraft();
    return currentDraft.createdSource ? 'create' : currentDraft.createdSourceId ? 'reuse' : 'create';
  });

  const sourceInput = draft.sourceInput;
  const createdSource = draft.createdSource;
  const savedSourceId = draft.createdSourceId ?? createdSource?.id ?? null;

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

  const availableProjectTypes = useMemo<ProjectType[]>(() => {
    const values = capabilities?.project_types
      ?.map((value) => normalizeProjectTypeValue(value))
      .filter((value): value is ProjectType => Boolean(value && value !== 'unknown'));

    return values && values.length > 0 ? values : ['backend', 'frontend', 'llm_app', 'agent'];
  }, [capabilities?.project_types]);

  const availableRunModes = useMemo<RunMode[]>(() => {
    const values = capabilities?.run_modes?.filter((value): value is RunMode => value === 'advisory' || value === 'strict');
    return values && values.length > 0 ? values : ['advisory', 'strict'];
  }, [capabilities?.run_modes]);

  const availableScopes = useMemo<EvaluationScope[]>(() => {
    const values = capabilities?.scopes?.filter((value): value is EvaluationScope => value === 'full' || value === 'delta');
    return values && values.length > 0 ? values : ['full', 'delta'];
  }, [capabilities?.scopes]);

  const enabledDimensions = useMemo(() => {
    return capabilities?.dimensions?.filter((item) => item.enabled) ?? [];
  }, [capabilities?.dimensions]);

  const updateSourceInput = useCallback((patch: SourceInputPatch) => {
    setDraft((current) => {
      const entries = Object.entries(patch) as Array<
        [keyof ProjectEvalSourceInputDraft, ProjectEvalSourceInputDraft[keyof ProjectEvalSourceInputDraft]]
      >;
      const sourceChanged = entries.some(([key, value]) => current.sourceInput[key] !== value);

      if (!sourceChanged) {
        return current;
      }

      return {
        ...current,
        sourceInput: { ...current.sourceInput, ...patch },
        createdSourceId: null,
        createdSource: null,
      };
    });
  }, []);

  const hydrateSourceUpload = useCallback((patch: Pick<ProjectEvalSourceInputDraft, 'sourceUploadId' | 'sourceUpload'>) => {
    setDraft((current) => {
      if (
        current.sourceInput.sourceUploadId === patch.sourceUploadId &&
        current.sourceInput.sourceUpload === patch.sourceUpload
      ) {
        return current;
      }

      return {
        ...current,
        sourceInput: {
          ...current.sourceInput,
          sourceUploadId: patch.sourceUploadId,
          sourceUpload: patch.sourceUpload,
        },
      };
    });
  }, []);

  const handleResetDraft = useCallback(() => {
    clearProjectEvalProfileDraft();
    setDraft(createDefaultProjectEvalProfileDraft());
    setSourceEntryMode('create');
    message.success(t('source.draftCleared'));
  }, [t]);

  const handleCreateSource = useCallback(async () => {
    if (!sourceInput.sourceName.trim()) {
      message.warning(t('create.projectNameRequired'));
      return;
    }

    if (sourceInput.sourceType === 'git') {
      if (!sourceInput.gitUrl.trim()) {
        message.warning(t('create.gitUrlRequired'));
        return;
      }

      if (!sourceInput.commitSha.trim()) {
        message.warning(t('create.commitShaRequired'));
        return;
      }
    }

    if (sourceInput.sourceType === 'zip') {
      const stagedUploadId = sourceInput.sourceUploadId.trim();
      const stagedUploadStatus = sourceInput.sourceUpload?.status;
      const stagedUploadSummaryReady = Boolean(sourceInput.sourceUpload && sourceInput.sourceUpload.id === stagedUploadId);
      const hasCompatibilityFallback = Boolean(sourceInput.zipObjectKey.trim() && sourceInput.archiveSha256.trim());

      if (stagedUploadId && !stagedUploadSummaryReady) {
        message.warning(t('create.zipRefreshing'));
        return;
      }

      if (stagedUploadId && stagedUploadStatus && stagedUploadStatus !== 'ready') {
        const blockedStatusMessage = {
          pending_upload: t('create.zipStillUploading'),
          consumed: t('create.zipConsumed'),
          expired: t('create.zipExpired'),
          failed: t('create.zipFailed'),
        };

        message.warning(blockedStatusMessage[stagedUploadStatus]);
        return;
      }

      if (!stagedUploadId && !hasCompatibilityFallback) {
        message.warning(t('create.uploadFirst'));
        return;
      }
    }

    setCreatingSource(true);
    try {
      const stagedUploadId = sourceInput.sourceType === 'zip' ? sourceInput.sourceUploadId.trim() : '';
      const hasStagedUpload = Boolean(stagedUploadId);
      const response = await projectEvalService.createSource({
        name: sourceInput.sourceName.trim(),
        source_type: sourceInput.sourceType,
        git_url: sourceInput.sourceType === 'git' ? sourceInput.gitUrl.trim() : undefined,
        branch: sourceInput.sourceType === 'git' && sourceInput.branch.trim() ? sourceInput.branch.trim() : undefined,
        commit_sha: sourceInput.sourceType === 'git' ? sourceInput.commitSha.trim() : undefined,
        source_upload_id: sourceInput.sourceType === 'zip' && hasStagedUpload ? stagedUploadId : undefined,
        zip_object_key:
          sourceInput.sourceType === 'zip' && !hasStagedUpload && sourceInput.zipObjectKey.trim()
            ? sourceInput.zipObjectKey.trim()
            : undefined,
        archive_sha256:
          sourceInput.sourceType === 'zip' && !hasStagedUpload && sourceInput.archiveSha256.trim()
            ? sourceInput.archiveSha256.trim()
            : undefined,
        project_type: sourceInput.sourceProjectType,
        mode: sourceInput.sourceMode,
      });

      const source = response as unknown as ProjectEvalSource;
      const nextSourceInput =
        sourceInput.sourceType === 'zip' && sourceInput.sourceUpload
          ? {
              ...draft.sourceInput,
              sourceUpload: {
                ...sourceInput.sourceUpload,
                status: 'consumed' as const,
                source_id: source.id,
              },
            }
          : draft.sourceInput;
      const nextDraft: ProjectEvalProfileDraft = {
        ...draft,
        sourceInput: nextSourceInput,
        createdSourceId: source.id,
        createdSource: source,
        runSettings: {
          ...draft.runSettings,
          runMode: sourceInput.sourceMode ?? draft.runSettings.runMode,
          runProjectType:
            normalizeProjectTypeValue(source.detected_type) ??
            sourceInput.sourceProjectType ??
            draft.runSettings.runProjectType,
        },
      };

      saveProjectEvalProfileDraft(nextDraft);
      setDraft(nextDraft);
      message.success(t('create.sourceCreated'));
      navigate(`/project-eval/create/profile/${source.id}`);
    } catch (error: unknown) {
      const response = (error as { response?: { data?: { message?: string } } })?.response;
      message.error(response?.data?.message || t('create.sourceCreateFailed'));
    } finally {
      setCreatingSource(false);
    }
  }, [draft, navigate, sourceInput, t]);

  const handleUseExistingSource = useCallback((source: ProjectEvalSourceListItem) => {
    const nextDraft: ProjectEvalProfileDraft = {
      ...draft,
      createdSourceId: source.id,
      createdSource: null,
    };

    saveProjectEvalProfileDraft(nextDraft);
    setDraft(nextDraft);
    message.success(t('create.existingSelected'));
    navigate(`/project-eval/create/profile/${source.id}`);
  }, [draft, navigate, t]);

  const handleOpenSavedProfile = useCallback(() => {
    if (!savedSourceId) {
      return;
    }

    navigate(`/project-eval/create/profile/${savedSourceId}`);
  }, [navigate, savedSourceId]);

  const detectedProjectType = normalizeProjectTypeValue(createdSource?.detected_type);
  const hasSavedSource = Boolean(savedSourceId);

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <PageHeader
        title={t('create.title')}
        description={t('create.description')}
        breadcrumb={[
          { title: t('common.dashboard') },
          { title: t('title') },
          { title: t('create.breadcrumb') },
        ]}
        extra={(
          <Space wrap>
            {hasSavedSource && (
              <Button type="primary" icon={<ArrowRightOutlined />} onClick={handleOpenSavedProfile}>
                {t('create.openSavedProfile')}
              </Button>
            )}
            <Button onClick={handleResetDraft}>{t('create.resetDraft')}</Button>
          </Space>
        )}
      />

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Space wrap>
            <Tag color="blue">{t('create.autoSaved')}</Tag>
            <Tag color="green">{t('create.previewBeforeStart')}</Tag>
            <Tag>{sourceEntryMode === 'reuse' ? t('source.reuse') : sourceInput.sourceType === 'git' ? t('source.gitConnect') : t('source.zipConnect')}</Tag>
          </Space>
          <Steps
            current={0}
            items={[
              { title: t('steps.connectSource'), description: t('steps.connectSourceDesc') },
              { title: t('steps.viewProfile'), description: t('steps.viewProfileDesc') },
              { title: t('steps.startEval'), description: t('steps.startEvalDesc') },
            ]}
          />
        </Space>
      </Card>

      {hasSavedSource && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('source.savedInBrowser')}
          description={t('source.savedInBrowserDesc')}
          action={(
            <Button size="small" type="primary" icon={<ArrowRightOutlined />} onClick={handleOpenSavedProfile}>
              {t('create.continueViewProfile')}
            </Button>
          )}
        />
      )}

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title={t('source.title')}>
            <Space direction="vertical" size={20} style={{ width: '100%' }}>
              <Alert
                type="info"
                showIcon
                message={t('source.selectMethod')}
                description={t('source.selectMethodDesc')}
              />

              <div>
                <Text strong>{t('create.entryMethod')}</Text>
                <div style={{ marginTop: 8 }}>
                  <Radio.Group
                    value={sourceEntryMode}
                    onChange={(event) => setSourceEntryMode(event.target.value as SourceEntryMode)}
                  >
                    <Radio.Button value="reuse">{t('create.reuseExisting')}</Radio.Button>
                    <Radio.Button value="create">{t('create.createNew')}</Radio.Button>
                  </Radio.Group>
                </div>
              </div>

              {sourceEntryMode === 'reuse' ? (
                <ProjectEvalSourceReuseBrowser
                  availableProjectTypes={availableProjectTypes}
                  onSelectSource={handleUseExistingSource}
                />
              ) : (
                <>
              <div>
                <Text strong>{t('create.projectName')}</Text>
                <Input
                  placeholder={t('source.namePlaceholder')}
                  value={sourceInput.sourceName}
                  onChange={(event) => updateSourceInput({ sourceName: event.target.value })}
                  style={{ marginTop: 8 }}
                />
              </div>

              <div>
                <Text strong>{t('create.sourceType')}</Text>
                <div style={{ marginTop: 8 }}>
                  <Radio.Group
                    value={sourceInput.sourceType}
                    onChange={(event) => updateSourceInput({ sourceType: event.target.value as SourceType })}
                  >
                    <Radio.Button value="git">{t('create.gitRepository')}</Radio.Button>
                    <Radio.Button value="zip">{t('create.uploadZipPackage')}</Radio.Button>
                  </Radio.Group>
                </div>
              </div>

              {sourceInput.sourceType === 'git' ? (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <div>
                    <Text strong>{t('create.gitUrl')}</Text>
                    <Input
                      placeholder={t('create.gitUrlPlaceholder')}
                      value={sourceInput.gitUrl}
                      onChange={(event) => updateSourceInput({ gitUrl: event.target.value })}
                      style={{ marginTop: 8 }}
                    />
                  </div>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Text strong>{t('create.branchOptional')}</Text>
                      <Input
                        placeholder={t('create.branchPlaceholder')}
                        value={sourceInput.branch}
                        onChange={(event) => updateSourceInput({ branch: event.target.value })}
                        style={{ marginTop: 8 }}
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <Text strong>{t('create.commitToEvaluate')}</Text>
                      <Input
                        placeholder={t('create.commitShaPlaceholder')}
                        value={sourceInput.commitSha}
                        onChange={(event) => updateSourceInput({ commitSha: event.target.value })}
                        style={{ marginTop: 8 }}
                      />
                    </Col>
                  </Row>
                  <Text type="secondary">
                    {t('create.commitShaNotice')}
                  </Text>
                </Space>
              ) : (
                <ProjectEvalZipUploadPanel
                  sourceInput={sourceInput}
                  onChange={updateSourceInput}
                  onHydrate={hydrateSourceUpload}
                />
              )}

              <div>
                <Text strong>{t('create.projectTypeHint')}</Text>
                <Select
                  allowClear
                  value={sourceInput.sourceProjectType}
                  placeholder={t('source.autoDetectHint')}
                  style={{ width: '100%', marginTop: 8 }}
                  options={availableProjectTypes.map((value) => ({ value, label: getProjectTypeLabel(value) }))}
                  onChange={(value) => updateSourceInput({ sourceProjectType: value as ProjectType | undefined })}
                />
              </div>

              <Collapse
                items={[
                  {
                    key: 'advanced-source',
                    label: t('create.advancedSourceSettings'),
                    children: (
                      <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        {sourceInput.sourceType === 'zip' && (
                          <>
                            <Alert
                              type="warning"
                              showIcon
                              message={t('source.fallbackNotice')}
                              description={t('source.fallbackNoticeDesc')}
                            />
                            <div>
                              <Text strong>{t('create.zipObjectKey')}</Text>
                              <Input
                                placeholder={t('create.zipObjectKeyPlaceholder')}
                                value={sourceInput.zipObjectKey}
                                onChange={(event) => updateSourceInput({ zipObjectKey: event.target.value })}
                                style={{ marginTop: 8 }}
                              />
                            </div>
                            <div>
                              <Text strong>{t('create.archiveSha256')}</Text>
                              <Input
                                placeholder={t('create.archiveSha256Placeholder')}
                                value={sourceInput.archiveSha256}
                                onChange={(event) => updateSourceInput({ archiveSha256: event.target.value })}
                                style={{ marginTop: 8 }}
                              />
                            </div>
                          </>
                        )}

                        <div>
                          <Text strong>{t('create.preferredRunMode')}</Text>
                          <Select
                            allowClear
                            value={sourceInput.sourceMode}
                            placeholder={t('source.useDefaultRecommend')}
                            style={{ width: '100%', marginTop: 8 }}
                            options={availableRunModes.map((value) => ({ value, label: getRunModeLabel(value) }))}
                            onChange={(value) => updateSourceInput({ sourceMode: value as RunMode | undefined })}
                          />
                        </div>
                      </Space>
                    ),
                  },
                ]}
              />

              <Space direction="vertical" size={8}>
                <Button type="primary" icon={<ArrowRightOutlined />} loading={creatingSource} onClick={handleCreateSource}>
                  {t('create.continueViewProjectProfile')}
                </Button>
                <Text type="secondary">
                  {t('create.onlyCreatesSource')}
                </Text>
              </Space>
                </>
              )}

            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {createdSource && (
              <Card title={t('source.currentSaved')}>
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  <div>
                    <Text strong>{createdSource.name}</Text>
                  </div>
                  <Text type="secondary">Source ID: {createdSource.id}</Text>
                  <Text type="secondary">{t('create.detectedProjectType', { type: getProjectTypeLabel(createdSource.detected_type) })}</Text>
                  <Text type="secondary">{t('create.updatedTime', { time: formatDateTime(createdSource.updated_at) })}</Text>
                  <Button type="primary" block icon={<ArrowRightOutlined />} onClick={handleOpenSavedProfile}>
                    {t('create.continueViewProfile')}
                  </Button>
                </Space>
              </Card>
            )}

            <Card title={t('create.whatHappensNext')}>
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Text>{t('create.nextStep1')}</Text>
                <Text>{t('create.nextStep2')}</Text>
                <Text>{t('create.nextStep3')}</Text>
                <Text>{t('create.nextStep4')}</Text>
              </Space>
            </Card>

            <Card title={t('create.currentCapability')}>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <div>
                  <Text strong>{t('create.supportedProjectTypes')}</Text>
                  <div style={{ marginTop: 8 }}>
                    {availableProjectTypes.map((value) => (
                      <Tag key={value}>{getProjectTypeLabel(value)}</Tag>
                    ))}
                  </div>
                </div>
                <div>
                  <Text strong>{t('create.runModes')}</Text>
                  <div style={{ marginTop: 8 }}>
                    {availableRunModes.map((value) => (
                      <Tag key={value}>{getRunModeLabel(value)}</Tag>
                    ))}
                  </div>
                </div>
                <div>
                  <Text strong>{t('create.scopes')}</Text>
                  <div style={{ marginTop: 8 }}>
                    {availableScopes.map((value) => (
                      <Tag key={value}>{getScopeLabel(value)}</Tag>
                    ))}
                  </div>
                </div>
                {enabledDimensions.length > 0 && (
                  <div>
                    <Text strong>{t('create.enabledDimensions')}</Text>
                    <div style={{ marginTop: 8 }}>
                      {enabledDimensions.map((item) => (
                        <div key={item.name} style={{ marginBottom: 6 }}>
                          <Tag>{humanizeKey(item.name)}</Tag>
                          <Text type="secondary">
                            {t('create.dimensionWeight', { weight: (item.effective_weight * 100).toFixed(0), costClass: item.cost_class })}
                          </Text>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Space>
            </Card>

            <Card title={t('create.knownGaps')}>
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Text>- {t(ZIP_SOURCE_MAINLINE_GAP_TEXT_KEY)}</Text>
                <Text>- {t('create.gapProfiling')}</Text>
                <Text>- {t('create.gapModes')}</Text>
                <Text>- {t('create.gapMatrix')}</Text>
              </Space>
            </Card>

            <Card title={t('create.whySplit')}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Title level={5} style={{ margin: 0 }}>
                  {t('create.reduceWrongExpectation')}
                </Title>
                <Text type="secondary">
                  {t('create.splitExplanation')}
                </Text>
                {detectedProjectType && detectedProjectType !== 'unknown' && (
                  <Tag color="green">{getProjectTypeLabel(detectedProjectType)}</Tag>
                )}
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
}

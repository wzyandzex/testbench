import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Breadcrumb,
  Button,
  Divider,
  Input,
  Modal,
  Space,
  Steps,
  Tag,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Benchmark } from '@/types';
import { DatasetSelector } from './components/DatasetSelector';
import { FileUploader } from './components/FileUploader';
import { ImportConfig } from './components/ImportConfig';
import { ImportProgress } from './components/ImportProgress';
import { ImportSourceSelector } from './components/ImportSourceSelector';
import { ImportTaskList } from './components/ImportTaskList';
import { UrlImporter } from './components/UrlImporter';
import {
  DATASET_INFO,
  importService,
  type BenchmarkImportSource,
  type DatasetType,
  type ImportConfigType,
  type ImportTask,
  type SourceType,
} from './service';
import { getImportCSS } from './style';
import { useImportStore } from './store';

const { Step } = Steps;
const BENCHMARK_JSON_PLACEHOLDER = `{
  "name": "repo_fix",
  "display_name": "Repository fix benchmark",
  "type": "code_fix",
  "description": "Checks whether the agent can complete repo-level fix tasks"
}`;
const BENCHMARK_YAML_PLACEHOLDER = `name: repo_fix
display_name: Repository fix benchmark
type: code_fix
description: Checks whether the agent can complete repo-level fix tasks`;

const BenchmarkImportCapabilityCard = memo(function BenchmarkImportCapabilityCard({
  loading,
  error,
  sources,
  selectedType,
}: {
  loading: boolean;
  error: string | null;
  sources: BenchmarkImportSource[] | null;
  selectedType?: SourceType | null;
}) {
  const { t } = useTranslation('import');
  if (loading) {
    return (
      <Alert
        showIcon
        style={{ marginTop: 16 }}
        type="info"
        message={t('capability.loadingTitle')}
        description={t('capability.loadingDesc')}
      />
    );
  }

  if (error) {
    return (
      <Alert
        showIcon
        style={{ marginTop: 16 }}
        type="warning"
        message={t('capability.loadFailedTitle')}
        description={error}
      />
    );
  }

  if (!sources?.length) {
    return null;
  }

  const enabledSources = sources.filter((source) => source.enabled);
  const selectedSource = selectedType
    ? enabledSources.find((source) => source.name === selectedType)
    : undefined;

  return (
    <div
      style={{
        marginTop: 16,
        padding: 16,
        borderRadius: 14,
        border: '1px solid rgba(15, 23, 42, 0.08)',
        background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.96), rgba(241, 245, 249, 0.9))',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {t('capability.cardTitle')}
      </div>
      <div style={{ marginTop: 6, color: 'var(--import-text-secondary)', fontSize: 13 }}>
        {t('capability.cardDesc')}
      </div>

      <Space wrap size={[8, 8]} style={{ marginTop: 12 }}>
        {enabledSources.map((source) => (
          <Tag
            key={source.name}
            color={selectedSource?.name === source.name ? 'blue' : 'default'}
          >
            {source.display_name}
          </Tag>
        ))}
      </Space>

      {selectedSource ? (
        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          <div>
            <strong>{selectedSource.display_name}</strong>
            <div style={{ marginTop: 4, color: 'var(--import-text-secondary)', fontSize: 13 }}>
              {selectedSource.description}
            </div>
          </div>

          {selectedSource.formats?.length ? (
            <div>
              <div style={{ marginBottom: 6, fontSize: 12, color: 'var(--import-text-secondary)' }}>
                {t('capability.formatsLabel')}
              </div>
              <Space wrap size={[8, 8]}>
                {selectedSource.formats.map((format) => (
                  <Tag key={format}>{format}</Tag>
                ))}
              </Space>
            </div>
          ) : null}

          {selectedSource.max_size ? (
            <div style={{ fontSize: 13 }}>
              <strong>{t('capability.maxSizeLabel')}</strong> {selectedSource.max_size}
            </div>
          ) : null}

          {selectedSource.whitelist?.length ? (
            <div>
              <div style={{ marginBottom: 6, fontSize: 12, color: 'var(--import-text-secondary)' }}>
                {t('capability.whitelistLabel')}
              </div>
              <Space wrap size={[8, 8]}>
                {selectedSource.whitelist.map((domain) => (
                  <Tag key={domain}>{domain}</Tag>
                ))}
              </Space>
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ marginTop: 14, color: 'var(--import-text-secondary)', fontSize: 13 }}>
          {t('capability.noneSelected')}
        </div>
      )}
    </div>
  );
});

const JsonInput = memo(function JsonInput({
  disabled,
  onChange,
  placeholder,
  value,
}: {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const { t } = useTranslation('import');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    onChange(nextValue);

    if (!nextValue.trim()) {
      setJsonError(null);
      return;
    }

    try {
      JSON.parse(nextValue);
      setJsonError(null);
    } catch {
      setJsonError(t('wizard.jsonInvalid'));
    }
  }, [onChange, t]);

  return (
    <div>
      <Input.TextArea
        disabled={disabled}
        onChange={handleChange}
        placeholder={placeholder || BENCHMARK_JSON_PLACEHOLDER}
        rows={10}
        style={{ fontFamily: 'monospace' }}
        value={value || ''}
      />
      {jsonError && (
        <Alert
          showIcon
          style={{ marginTop: 12 }}
          type="error"
          message={t('wizard.jsonValidationFailed')}
          description={jsonError}
        />
      )}
    </div>
  );
});

const YamlInput = memo(function YamlInput({
  disabled,
  onChange,
  placeholder,
  value,
}: {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <Input.TextArea
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder || BENCHMARK_YAML_PLACEHOLDER}
      rows={10}
      style={{ fontFamily: 'monospace' }}
      value={value || ''}
    />
  );
});

const HuggingFaceInput = memo(function HuggingFaceInput({
  disabled,
  onChange,
  value,
}: {
  value?: { repo?: string; filename?: string };
  onChange: (value: { repo?: string; filename?: string }) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation('import');
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <div style={{ marginBottom: 8 }}>{t('form.hfRepoLabel')}</div>
        <Input
          disabled={disabled}
          onChange={(event) => onChange({ ...value, repo: event.target.value })}
          placeholder="openai/humaneval"
          value={value?.repo || ''}
        />
      </div>
      <div>
        <div style={{ marginBottom: 8 }}>{t('form.hfFilenameLabel')}</div>
        <Input
          disabled={disabled}
          onChange={(event) => onChange({ ...value, filename: event.target.value })}
          placeholder="data/humaneval.jsonl"
          value={value?.filename || ''}
        />
      </div>
    </Space>
  );
});

function getErrorMessage(error: unknown, fallback: string) {
  const response = (error as { response?: { data?: { message?: string } } })?.response;
  return response?.data?.message || fallback;
}

interface ImportPageProps {
  benchmarkOnly?: boolean;
}

function parsePreferredBenchmarkSource(value: string | null): SourceType | null {
  switch (value) {
    case 'file':
    case 'url':
    case 'json':
    case 'yaml':
      return value;
    default:
      return null;
  }
}

function parseMaxSize(value?: string): number | null {
  if (!value) {
    return null;
  }

  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*(kb|mb|gb)$/i);
  if (!match) {
    return null;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multiplier = unit === 'gb' ? 1024 * 1024 * 1024 : unit === 'mb' ? 1024 * 1024 : 1024;
  return Math.round(amount * multiplier);
}

function buildBenchmarkUrlPlaceholder(source?: BenchmarkImportSource): string {
  const whitelist = source?.whitelist ?? [];

  if (whitelist.includes('raw.githubusercontent.com')) {
    return 'https://raw.githubusercontent.com/org/repo/main/benchmark.yaml';
  }

  if (whitelist.includes('gist.githubusercontent.com')) {
    return 'https://gist.githubusercontent.com/user/id/raw/benchmark.yaml';
  }

  if (whitelist.includes('huggingface.co')) {
    return 'https://huggingface.co/datasets/org/repo/resolve/main/benchmark.yaml';
  }

  if (whitelist.length > 0) {
    return `https://${whitelist[0]}/path/to/benchmark.yaml`;
  }

  return 'https://example.com/benchmark.yaml';
}

const BenchmarkSourceInputHint = memo(function BenchmarkSourceInputHint({
  source,
  sourceType,
}: {
  source?: BenchmarkImportSource;
  sourceType?: SourceType | null;
}) {
  const { t } = useTranslation('import');
  if (!sourceType) {
    return null;
  }

  if (sourceType === 'file') {
    const formats = (source?.formats ?? ['.json', '.yaml', '.yml']).join(', ');
    const maxSize = source?.max_size ? t('sourceHints.fileMaxSize', { size: source.max_size }) : '';
    return (
      <Alert
        showIcon
        style={{ marginBottom: 12 }}
        type="info"
        message={t('sourceHints.fileTitle')}
        description={t('sourceHints.fileDesc', { formats, maxSize })}
      />
    );
  }

  if (sourceType === 'url') {
    return (
      <Alert
        showIcon
        style={{ marginBottom: 12 }}
        type="info"
        message={t('sourceHints.urlTitle')}
        description={source?.whitelist?.length
          ? t('sourceHints.urlAllowed', { whitelist: source.whitelist.join(', ') })
          : t('sourceHints.urlGeneric')}
      />
    );
  }

  if (sourceType === 'json' || sourceType === 'yaml') {
    return (
      <Alert
        showIcon
        style={{ marginBottom: 12 }}
        type="info"
        message={t('sourceHints.rawTitle', { format: sourceType.toUpperCase() })}
        description={t('sourceHints.rawDesc')}
      />
    );
  }

  return null;
});

export function ImportPage({
  benchmarkOnly = false,
}: ImportPageProps) {
  const { t } = useTranslation('import');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tasks = useImportStore((state) => state.tasks);
  const total = useImportStore((state) => state.total);
  const loading = useImportStore((state) => state.loading);
  const submitting = useImportStore((state) => state.submitting);
  const wizard = useImportStore((state) => state.wizard);

  const fetchTasks = useImportStore((state) => state.fetchTasks);
  const createTask = useImportStore((state) => state.createTask);
  const cancelTask = useImportStore((state) => state.cancelTask);
  const deleteTask = useImportStore((state) => state.deleteTask);
  const openWizard = useImportStore((state) => state.openWizard);
  const closeWizard = useImportStore((state) => state.closeWizard);
  const resetWizard = useImportStore((state) => state.resetWizard);
  const setDatasetType = useImportStore((state) => state.setDatasetType);
  const setSourceType = useImportStore((state) => state.setSourceType);
  const setWizardStep = useImportStore((state) => state.setWizardStep);
  const updateWizardConfig = useImportStore((state) => state.updateWizardConfig);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlValue, setUrlValue] = useState('');
  const [jsonValue, setJsonValue] = useState('');
  const [yamlValue, setYamlValue] = useState('');
  const [huggingfaceValue, setHuggingfaceValue] = useState<{ repo?: string; filename?: string }>({});
  const [currentTask, setCurrentTask] = useState<ImportTask | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [directImporting, setDirectImporting] = useState(false);
  const [benchmarkSources, setBenchmarkSources] = useState<BenchmarkImportSource[] | null>(null);
  const [benchmarkSourcesLoading, setBenchmarkSourcesLoading] = useState(false);
  const [benchmarkSourcesError, setBenchmarkSourcesError] = useState<string | null>(null);

  const isDirectBenchmarkImport = wizard.datasetType === 'benchmark';
  const preferredBenchmarkSource = parsePreferredBenchmarkSource(searchParams.get('source'));
  const selectedBenchmarkCapability = useMemo(() => {
    if (!isDirectBenchmarkImport || !wizard.sourceType) {
      return undefined;
    }

    return benchmarkSources?.find((source) => source.name === wizard.sourceType);
  }, [benchmarkSources, isDirectBenchmarkImport, wizard.sourceType]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const styleId = 'import-page-styles';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = getImportCSS();
  }, []);

  const loadBenchmarkSources = useCallback(async () => {
    setBenchmarkSourcesLoading(true);
    setBenchmarkSourcesError(null);

    try {
      const sources = await importService.getSources();
      setBenchmarkSources(sources);
    } catch (error: unknown) {
      console.error('Failed to load benchmark import capabilities', error);
      setBenchmarkSources([]);
      setBenchmarkSourcesError(
        getErrorMessage(error, 'Capability metadata could not be loaded right now.')
      );
    } finally {
      setBenchmarkSourcesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!wizard.open || wizard.datasetType !== 'benchmark' || benchmarkSources !== null || benchmarkSourcesLoading) {
      return;
    }

    void loadBenchmarkSources();
  }, [
    benchmarkSources,
    benchmarkSourcesLoading,
    loadBenchmarkSources,
    wizard.datasetType,
    wizard.open,
  ]);

  const resetSourceInputs = useCallback(() => {
    setSelectedFile(null);
    setUrlValue('');
    setJsonValue('');
    setYamlValue('');
    setHuggingfaceValue({});
  }, []);

  useEffect(() => {
    if (!benchmarkOnly || wizard.open) {
      return;
    }

    resetSourceInputs();
    setCurrentTask(null);
    setDirectImporting(false);
    openWizard();
    setDatasetType('benchmark');
    setSourceType(preferredBenchmarkSource);
    setWizardStep(2);
  }, [
    benchmarkOnly,
    openWizard,
    preferredBenchmarkSource,
    resetSourceInputs,
    setDatasetType,
    setSourceType,
    setWizardStep,
    wizard.open,
  ]);

  useEffect(() => {
    if (!benchmarkOnly || !wizard.open || wizard.datasetType !== 'benchmark') {
      return;
    }

    setSourceType(preferredBenchmarkSource);
  }, [benchmarkOnly, preferredBenchmarkSource, setSourceType, wizard.datasetType, wizard.open]);

  const openBenchmarkImportWorkspace = useCallback(() => {
    closeWizard();
    resetWizard();
    navigate('/benchmarks/create/import');
  }, [closeWizard, navigate, resetWizard]);

  const handleDatasetTypeChange = useCallback((type: DatasetType) => {
    if (!benchmarkOnly && type === 'benchmark') {
      openBenchmarkImportWorkspace();
      return;
    }

    setDatasetType(type);
    setSourceType(null);
    setWizardStep(1);
    resetSourceInputs();
  }, [
    benchmarkOnly,
    openBenchmarkImportWorkspace,
    resetSourceInputs,
    setDatasetType,
    setSourceType,
    setWizardStep,
  ]);

  const handleOpenWizard = useCallback(() => {
    resetSourceInputs();
    setCurrentTask(null);
    setDirectImporting(false);
    openWizard();

    if (benchmarkOnly) {
      setDatasetType('benchmark');
      setSourceType(preferredBenchmarkSource);
      setWizardStep(2);
    }
  }, [
    benchmarkOnly,
    openWizard,
    preferredBenchmarkSource,
    resetSourceInputs,
    setDatasetType,
    setSourceType,
    setWizardStep,
  ]);

  const handleCloseWizard = useCallback(() => {
    if (benchmarkOnly) {
      closeWizard();
      resetWizard();
      navigate('/benchmarks/create');
      return;
    }

    closeWizard();
  }, [benchmarkOnly, closeWizard, navigate, resetWizard]);

  const handlePrev = useCallback(() => {
    if (benchmarkOnly && wizard.step <= 2) {
      handleCloseWizard();
      return;
    }

    if (wizard.step > 1) {
      setWizardStep(wizard.step - 1);
    }
  }, [benchmarkOnly, handleCloseWizard, setWizardStep, wizard.step]);

  const handleStartImport = useCallback(async () => {
    const { config, datasetType, sourceType } = wizard;

    if (!datasetType || !sourceType) {
      return;
    }

    try {
      if (datasetType === 'benchmark') {
        setDirectImporting(true);

        let benchmark: Benchmark | null = null;
        switch (sourceType) {
          case 'file':
            if (!selectedFile) {
              message.warning(t('warnings.chooseBenchmarkFile'));
              return;
            }
            benchmark = await importService.importFromFile({ file: selectedFile });
            break;
          case 'url':
            benchmark = await importService.importFromUrl({ url: urlValue.trim() });
            break;
          case 'json':
            benchmark = await importService.importFromJson({ jsonData: jsonValue });
            break;
          case 'yaml':
            benchmark = await importService.importFromYaml({ yamlData: yamlValue });
            break;
          default:
            message.warning(t('warnings.unsupportedBenchmark'));
            return;
        }

        if (benchmark?.id) {
          message.success(t('successes.benchmarkImported'));
          closeWizard();
          resetWizard();
          navigate(`/benchmarks/${benchmark.id}`);
        }
        return;
      }

      const importConfig: ImportConfigType = {
        datasetType,
        sourceType,
        ...config,
      };

      switch (sourceType) {
        case 'file':
          if (selectedFile) {
            importConfig.file = selectedFile;
          }
          break;
        case 'url':
          importConfig.url = urlValue.trim();
          break;
        case 'json':
          importConfig.jsonData = jsonValue;
          break;
        case 'yaml':
          importConfig.yamlData = yamlValue;
          break;
        case 'huggingface':
          importConfig.huggingfaceRepo = huggingfaceValue.repo;
          importConfig.huggingfaceFilename = huggingfaceValue.filename;
          break;
      }

      const task = await createTask(importConfig);
      setCurrentTask(task);
      setWizardStep(4);
      message.success(t('successes.taskCreated'));
    } catch (error: unknown) {
      if (datasetType === 'benchmark') {
        message.error(getErrorMessage(error, t('errors.benchmarkImportFailed')));
      }
    } finally {
      setDirectImporting(false);
    }
  }, [
    closeWizard,
    createTask,
    huggingfaceValue.filename,
    huggingfaceValue.repo,
    jsonValue,
    navigate,
    resetWizard,
    selectedFile,
    setWizardStep,
    urlValue,
    yamlValue,
    wizard,
    t,
  ]);

  const handleNext = useCallback(() => {
    const { datasetType, sourceType, step } = wizard;

    if (step === 1) {
      if (!datasetType) {
        message.warning(t('warnings.chooseDataset'));
        return;
      }
      setWizardStep(2);
      return;
    }

    if (step === 2) {
      if (!sourceType) {
        message.warning(t('warnings.chooseSource'));
        return;
      }
      if (datasetType === 'benchmark' && sourceType === 'huggingface') {
        message.warning(t('warnings.benchmarkNoHF'));
        return;
      }
      if (sourceType === 'file' && !selectedFile) {
        message.warning(t('warnings.chooseFile'));
        return;
      }
      if (sourceType === 'url' && !urlValue.trim()) {
        message.warning(t('warnings.inputUrl'));
        return;
      }
      if (sourceType === 'json' && !jsonValue.trim()) {
        message.warning(t('warnings.pasteJson'));
        return;
      }
      if (sourceType === 'yaml' && !yamlValue.trim()) {
        message.warning(t('warnings.pasteYaml'));
        return;
      }
      setWizardStep(3);
      return;
    }

    if (step === 3) {
      void handleStartImport();
    }
  }, [handleStartImport, jsonValue, selectedFile, setWizardStep, urlValue, wizard, yamlValue, t]);

  const handleComplete = useCallback(() => {
    closeWizard();
    resetWizard();
    void fetchTasks();
  }, [closeWizard, fetchTasks, resetWizard]);

  const handleViewTask = useCallback((task: ImportTask) => {
    setCurrentTask(task);
    setShowTaskDetail(true);
  }, []);

  const handleCancelTask = useCallback(async (id: string) => {
    await cancelTask(id);
      message.success(t('successes.taskCancelled'));
    void fetchTasks();
  }, [cancelTask, fetchTasks, t]);

  const handleDeleteTask = useCallback(async (id: string) => {
    await deleteTask(id);
      message.success(t('successes.taskDeleted'));
    void fetchTasks();
  }, [deleteTask, fetchTasks, t]);

  const renderSourceInput = useCallback(() => {
    switch (wizard.sourceType) {
      case 'file':
        return (
          <>
            <BenchmarkSourceInputHint
              source={selectedBenchmarkCapability}
              sourceType={wizard.sourceType}
            />
            <FileUploader
              value={selectedFile}
              onChange={setSelectedFile}
              accept={(selectedBenchmarkCapability?.formats ?? ['.json', '.yaml', '.yml']).join(',')}
              maxSize={parseMaxSize(selectedBenchmarkCapability?.max_size) ?? 100 * 1024 * 1024}
              titleText={t('uploader.fileTitle')}
              hintText={t('uploader.fileHint', {
                formats: (selectedBenchmarkCapability?.formats ?? ['.json', '.yaml', '.yml']).join(', '),
                maxSize: selectedBenchmarkCapability?.max_size ? t('sourceHints.fileMaxSize', { size: selectedBenchmarkCapability.max_size }) : '',
              })}
              formatsText={(selectedBenchmarkCapability?.formats ?? ['.json', '.yaml', '.yml']).join(' ')}
            />
          </>
        );
      case 'url':
        return (
          <>
            <BenchmarkSourceInputHint
              source={selectedBenchmarkCapability}
              sourceType={wizard.sourceType}
            />
            <UrlImporter
              value={urlValue}
              onChange={setUrlValue}
              placeholder={buildBenchmarkUrlPlaceholder(selectedBenchmarkCapability)}
            />
          </>
        );
      case 'json':
        return (
          <>
            <BenchmarkSourceInputHint
              source={selectedBenchmarkCapability}
              sourceType={wizard.sourceType}
            />
            <JsonInput
              value={jsonValue}
              onChange={setJsonValue}
              placeholder={BENCHMARK_JSON_PLACEHOLDER}
            />
          </>
        );
      case 'yaml':
        return (
          <>
            <BenchmarkSourceInputHint
              source={selectedBenchmarkCapability}
              sourceType={wizard.sourceType}
            />
            <YamlInput
              value={yamlValue}
              onChange={setYamlValue}
              placeholder={BENCHMARK_YAML_PLACEHOLDER}
            />
          </>
        );
      case 'huggingface':
        return <HuggingFaceInput value={huggingfaceValue} onChange={setHuggingfaceValue} />;
      default:
        return null;
    }
  }, [
    huggingfaceValue,
    jsonValue,
    selectedBenchmarkCapability,
    selectedFile,
    urlValue,
    wizard.sourceType,
    yamlValue,
  ]);

  const steps = benchmarkOnly
    ? [
      { title: t('wizard.stepSource'), description: t('wizard.stepSourceDescBenchmark') },
      { title: t('wizard.stepConfirm'), description: t('wizard.stepConfirmDescBenchmark') },
    ]
    : [
      { title: t('wizard.stepDataset'), description: t('wizard.stepDatasetDesc') },
      { title: t('wizard.stepSource'), description: t('wizard.stepSourceDescGeneric') },
      { title: t('wizard.stepConfirm'), description: t('wizard.stepConfirmDescGeneric') },
      { title: t('wizard.stepProgress'), description: t('wizard.stepProgressDesc') },
    ];
  const currentStep = benchmarkOnly ? Math.max(0, wizard.step - 2) : wizard.step - 1;

  return (
    <div className="import-page-container" style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 48px' }}>
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>
          <Button
            type="text"
            size="small"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(benchmarkOnly ? '/benchmarks/create' : '/benchmarks')}
            style={{ paddingLeft: 0 }}
          >
            {benchmarkOnly ? t('page.backToBenchmarkCreate') : t('page.backToBenchmarkList')}
          </Button>
        </Breadcrumb.Item>
      </Breadcrumb>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>
            {benchmarkOnly ? t('page.benchmarkTitle') : t('page.datasetTitle')}
          </h1>
          <p style={{ margin: '8px 0 0 0', fontSize: 14, color: 'var(--import-text-secondary)' }}>
            {benchmarkOnly ? t('page.benchmarkSubtitle') : t('page.datasetSubtitle')}
          </p>
          {benchmarkOnly && preferredBenchmarkSource && (
            <div style={{ marginTop: 10 }}>
              <Tag color="blue">{t('page.preselectedSource', { source: preferredBenchmarkSource })}</Tag>
            </div>
          )}
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleOpenWizard}>
          {benchmarkOnly ? t('page.openBenchmarkBtn') : t('page.openWizardBtn')}
        </Button>
      </div>

      {benchmarkOnly ? (
        <Alert
          showIcon
          type="info"
          style={{ marginBottom: 24 }}
          message={t('alerts.benchmarkInCreateTitle')}
          description={t('alerts.benchmarkInCreateDesc')}
        />
      ) : (
        <>
          <Alert
            showIcon
            type="info"
            style={{ marginBottom: 16 }}
            message={t('alerts.benchmarkSeparateTitle')}
            description={t('alerts.benchmarkSeparateDesc')}
            action={(
              <Button size="small" onClick={openBenchmarkImportWorkspace}>
                {t('page.openBenchmarkBtn')}
              </Button>
            )}
          />

          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--import-text)' }}>
              {t('page.quickSelectTitle')}
            </h3>
            <DatasetSelector value={wizard.datasetType} onChange={handleDatasetTypeChange} />
          </div>

          <Divider style={{ margin: '32px 0' }} />

          <ImportTaskList
            tasks={tasks}
            total={total}
            loading={loading}
            onRefresh={fetchTasks}
            onCancel={handleCancelTask}
            onDelete={handleDeleteTask}
            onView={handleViewTask}
          />
        </>
      )}

      <Modal
        title={(
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CloudUploadOutlined style={{ color: '#667eea' }} />
            <span>{benchmarkOnly ? t('wizard.modalTitleBenchmark') : t('wizard.modalTitle')}</span>
          </div>
        )}
        open={wizard.open}
        onCancel={handleCloseWizard}
        width={700}
        footer={null}
        destroyOnClose
        rootClassName="import-modal-root"
      >
        <Steps current={currentStep} size="small" style={{ marginBottom: 32 }}>
          {steps.map((step, index) => (
            <Step key={index} title={step.title} description={step.description} />
          ))}
        </Steps>

        <div style={{ minHeight: 300 }}>
          {wizard.step === 1 && !benchmarkOnly && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h4 style={{ marginBottom: 16, color: 'var(--import-text)' }}>{t('wizard.selectDataset')}</h4>
              <DatasetSelector value={wizard.datasetType} onChange={handleDatasetTypeChange} />
            </div>
          )}

          {wizard.step === 2 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h4 style={{ marginBottom: 16, color: 'var(--import-text)' }}>{t('wizard.selectSource')}</h4>
              <ImportSourceSelector
                value={wizard.sourceType}
                datasetType={wizard.datasetType}
                onChange={setSourceType}
              />

              {isDirectBenchmarkImport && (
                <BenchmarkImportCapabilityCard
                  loading={benchmarkSourcesLoading}
                  error={benchmarkSourcesError}
                  sources={benchmarkSources}
                  selectedType={wizard.sourceType}
                />
              )}

              {wizard.sourceType && (
                <div style={{ marginTop: 24 }}>
                  <h5 style={{ marginBottom: 12, color: 'var(--import-text-secondary)', fontSize: 13 }}>
                    {t('wizard.sourceInput')}
                  </h5>
                  {renderSourceInput()}
                </div>
              )}
            </div>
          )}

          {wizard.step === 3 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h4 style={{ marginBottom: 16, color: 'var(--import-text)' }}>
                {isDirectBenchmarkImport ? t('wizard.confirmBenchmarkDirect') : t('wizard.confirmOptions')}
              </h4>

              {isDirectBenchmarkImport ? (
                <Alert
                  showIcon
                  type="info"
                  message={t('wizard.benchmarkNotice')}
                  description={(
                    <div>
                      <p>{t('wizard.benchmarkNoticeP1')}</p>
                      <p>{t('wizard.benchmarkNoticeP2')}</p>
                      <p>{t('wizard.benchmarkNoticeP3')}</p>
                    </div>
                  )}
                />
              ) : (
                <ImportConfig value={wizard.config} onChange={updateWizardConfig} />
              )}

              {isDirectBenchmarkImport && (
                <BenchmarkImportCapabilityCard
                  loading={benchmarkSourcesLoading}
                  error={benchmarkSourcesError}
                  sources={benchmarkSources}
                  selectedType={wizard.sourceType}
                />
              )}

              <Alert
                showIcon
                type="info"
                style={{ marginTop: 16 }}
                message={t('wizard.importSummary')}
                description={(
                  <div>
                    <p>{t('wizard.summaryDataset')}: <strong>{wizard.datasetType ? DATASET_INFO[wizard.datasetType]?.name : '-'}</strong></p>
                    <p>{t('wizard.summarySource')}: <strong>{wizard.sourceType || '-'}</strong></p>
                    {isDirectBenchmarkImport && (
                      <>
                        <p>{t('wizard.summarySubmit')}: <strong>{t('wizard.summarySubmitValue')}</strong></p>
                        <p>{t('wizard.summaryAfter')}: <strong>{t('wizard.summaryAfterValue')}</strong></p>
                      </>
                    )}
                  </div>
                )}
              />
            </div>
          )}

          {wizard.step === 4 && currentTask && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <h4 style={{ marginBottom: 16, color: 'var(--import-text)' }}>{t('wizard.progressTitle')}</h4>
              <ImportProgress task={currentTask} onCancel={() => void handleCancelTask(currentTask.id)} />

              {currentTask.status === 'completed' && (
                <div
                  style={{
                    marginTop: 24,
                    padding: 16,
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: 8,
                    textAlign: 'center',
                  }}
                >
                  <CheckCircleOutlined style={{ fontSize: 32, color: '#10b981', marginBottom: 8 }} />
                  <p style={{ margin: 0, color: '#10b981', fontWeight: 500 }}>
                    {t('wizard.completedTip')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: '1px solid var(--import-card-border, rgba(0,0,0,0.08))',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          {wizard.step === 4 ? (
            <Button type="primary" onClick={handleComplete}>
              {t('actions.done')}
            </Button>
          ) : (
            <>
              <Button onClick={wizard.step > 1 ? handlePrev : handleCloseWizard}>
                {wizard.step > 1 ? t('actions.back') : t('actions.cancel')}
              </Button>
              <Button
                type="primary"
                onClick={handleNext}
                loading={submitting || directImporting}
                disabled={
                  (wizard.step === 1 && !wizard.datasetType) ||
                  (wizard.step === 2 && !wizard.sourceType)
                }
              >
                {wizard.step === 3
                  ? isDirectBenchmarkImport
                    ? t('actions.createBenchmark')
                    : t('actions.startImport')
                  : t('actions.nextStep')}
              </Button>
            </>
          )}
        </div>
      </Modal>

      <Modal
        title={t('detail.title')}
        open={showTaskDetail}
        onCancel={() => setShowTaskDetail(false)}
        width={600}
        footer={currentTask?.status === 'running' ? (
          <Button danger onClick={() => currentTask && void handleCancelTask(currentTask.id)}>
            {t('detail.cancelTask')}
          </Button>
        ) : null}
      >
        {currentTask && <ImportProgress task={currentTask} showLogs />}
      </Modal>
    </div>
  );
}

export default function ImportPageRoute() {
  return <ImportPage />;
}

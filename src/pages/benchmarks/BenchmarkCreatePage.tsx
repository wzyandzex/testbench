import {
  type ReactNode,
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Form,
  Modal,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  EyeOutlined,
  HomeOutlined,
  PlayCircleOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { SplitPane } from '@/components/benchmark/MonacoEditor';
import {
  FormSectionBasic,
  FormSectionConfig,
  FormSectionFiles,
  FormSectionTest,
} from '@/components/benchmark/BenchmarkFormEnhanced';
import {
  useActionBarStyle,
  useConfigPanelStyle,
  useEditorPanelStyle,
} from '@/theme';
import type {
  BenchmarkConfig,
  BenchmarkDetail,
  BenchmarkType,
  CreateBenchmarkRequest,
  DifficultyLevel,
  TestConfig,
  UpdateBenchmarkRequest,
} from '@/types';
import * as styles from './style';

const { Title } = Typography;

interface BenchmarkFormContextType {
  form: ReturnType<typeof Form.useForm>[0];
  activeSection: string;
  setActiveSection: (key: string) => void;
  disabled?: boolean;
}

export const BenchmarkFormContext = createContext<BenchmarkFormContextType | null>(null);

export function useBenchmarkForm() {
  const context = useContext(BenchmarkFormContext);
  if (!context) {
    throw new Error('useBenchmarkForm must be used within BenchmarkFormContext.Provider');
  }
  return context;
}

function getInitialValues() {
  return {
    name: '',
    display_name: '',
    description: '',
    type: 'code_fix' as BenchmarkType,
    language: 'python',
    difficulty: 'medium' as DifficultyLevel,
    category: '',
    tags: [],
    config: {
      initial_state: {
        files: {},
        repo_url: '',
        commit_hash: '',
        branch: 'main',
        base_dir: '',
      },
      required_files: [],
      instructions: {
        user_prompt: '',
        system_prompt: '',
        context: '',
        examples: [],
        hints: [],
      },
      goal: '',
      constraints: [],
      success_criteria: [],
      timeout: 300,
      max_attempts: 3,
      resource_limits: {
        max_memory_mb: 512,
        max_cpu_count: 2,
        max_duration: 300,
        max_disk_usage_mb: 1024,
        network_access: false,
      },
      agent_config: {
        mode: 'code_edit' as const,
        tools: [],
        temperature: 0.7,
        max_tokens: 2000,
        max_steps: 10,
        allow_retry: true,
        verbose: false,
      },
    },
    test_config: {
      type: 'unit' as const,
      script: '',
      command: 'pytest',
      args: [],
      timeout: 60,
      env: {},
      expected: {
        exit_code: 0,
      },
    },
  };
}

function mergeBenchmarkConfig(
  baseConfig: BenchmarkConfig,
  overrides?: Partial<BenchmarkConfig>
): BenchmarkConfig {
  if (!overrides) {
    return baseConfig;
  }

  return {
    ...baseConfig,
    ...overrides,
    initial_state: {
      ...baseConfig.initial_state,
      ...overrides.initial_state,
      files: overrides.initial_state?.files ?? baseConfig.initial_state.files,
    },
    required_files: overrides.required_files ?? baseConfig.required_files,
    instructions: {
      ...baseConfig.instructions,
      ...overrides.instructions,
      examples: overrides.instructions?.examples ?? baseConfig.instructions.examples,
      hints: overrides.instructions?.hints ?? baseConfig.instructions.hints,
    },
    constraints: overrides.constraints ?? baseConfig.constraints,
    success_criteria: overrides.success_criteria ?? baseConfig.success_criteria,
    resource_limits: {
      ...baseConfig.resource_limits,
      ...overrides.resource_limits,
    },
    agent_config: {
      ...baseConfig.agent_config,
      ...overrides.agent_config,
    },
  };
}

function mergeBenchmarkTestConfig(
  baseConfig: TestConfig,
  overrides?: Partial<TestConfig>
): TestConfig {
  if (!overrides) {
    return baseConfig;
  }

  return {
    ...baseConfig,
    ...overrides,
    args: overrides.args ?? baseConfig.args,
    env: overrides.env ?? baseConfig.env,
    expected: {
      ...baseConfig.expected,
      ...overrides.expected,
    },
  };
}

function buildCreateInitialValues(createPayloadDefaults?: Partial<CreateBenchmarkRequest>) {
  const baseValues = getInitialValues();
  if (!createPayloadDefaults) {
    return baseValues;
  }

  return {
    ...baseValues,
    ...createPayloadDefaults,
    tags: createPayloadDefaults.tags ?? baseValues.tags,
    config: mergeBenchmarkConfig(baseValues.config, createPayloadDefaults.config),
    test_config: mergeBenchmarkTestConfig(baseValues.test_config, createPayloadDefaults.test_config),
  };
}

function buildCreatePayload(
  values: Partial<CreateBenchmarkRequest>,
  status: CreateBenchmarkRequest['status'],
  createPayloadDefaults?: Partial<CreateBenchmarkRequest>
): CreateBenchmarkRequest {
  const payloadBase = buildCreateInitialValues(createPayloadDefaults);

  return {
    ...payloadBase,
    ...values,
    tags: values.tags ?? payloadBase.tags,
    status,
    config: mergeBenchmarkConfig(payloadBase.config, values.config),
    test_config: mergeBenchmarkTestConfig(payloadBase.test_config, values.test_config),
  };
}

interface BenchmarkFormPageProps {
  mode?: 'create' | 'edit';
  createPayloadDefaults?: Partial<CreateBenchmarkRequest>;
  banner?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
}

export const BenchmarkFormPage = memo(function BenchmarkFormPage({
  mode = 'create',
  createPayloadDefaults,
  banner,
  onBack,
  backLabel,
}: BenchmarkFormPageProps) {
  const { t } = useTranslation('benchmarks');
  const resolvedBackLabel = backLabel ?? t('formPage.backDefault');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const configPanelStyle = useConfigPanelStyle();
  const editorPanelStyle = useEditorPanelStyle();
  const actionBarStyle = useActionBarStyle();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('basic');
  const [, setSplitRatio] = useState(0.4);

  const contextValue = useMemo(() => ({
    form,
    activeSection,
    setActiveSection,
    disabled: false,
  }), [activeSection, form]);

  const createInitialValues = useMemo(
    () => buildCreateInitialValues(createPayloadDefaults),
    [createPayloadDefaults]
  );

  const exitPage = useCallback(() => {
    if (onBack) {
      onBack();
      return;
    }
    navigate('/benchmarks');
  }, [navigate, onBack]);

  const handleBack = useCallback(() => {
    if (!hasUnsavedChanges) {
      exitPage();
      return;
    }

    Modal.confirm({
      title: t('formPage.unsavedTitle'),
      content: t('formPage.unsavedContent'),
      okText: t('formPage.leave'),
      cancelText: t('formPage.continueEdit'),
      onOk: exitPage,
    });
  }, [exitPage, hasUnsavedChanges, t]);

  const handleFormChange = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const handleSaveDraft = useCallback(async () => {
    try {
      await form.validateFields();
      setSaving(true);

      const { status: _status, visibility: _visibility, ...values } = form.getFieldsValue(true);
      const data =
        mode === 'create'
          ? buildCreatePayload(values as Partial<CreateBenchmarkRequest>, 'draft', createPayloadDefaults)
          : ({ ...values, status: 'draft' } as UpdateBenchmarkRequest);

      if (mode === 'create') {
        const { benchmarkService } = await import('@/services/benchmark');
        const result = await benchmarkService.create(data as CreateBenchmarkRequest) as unknown as BenchmarkDetail;
        message.success(t('formPage.draftSaved'));
        if (result.id) {
          navigate(`/benchmarks/${result.id}/edit`);
        }
      } else {
        const { benchmarkService } = await import('@/services/benchmark');
        await benchmarkService.update(id!, data as UpdateBenchmarkRequest);
        message.success(t('formPage.draftUpdated'));
        setHasUnsavedChanges(false);
      }
    } catch (submitError: any) {
      setError(submitError?.response?.data?.message || t('formPage.saveFailed'));
    } finally {
      setSaving(false);
    }
  }, [createPayloadDefaults, form, id, mode, navigate, t]);

  const handleSubmit = useCallback(async () => {
    try {
      await form.validateFields();
      setSaving(true);

      const { status: _status, visibility: _visibility, ...values } = form.getFieldsValue(true);
      const data =
        mode === 'create'
          ? buildCreatePayload(values as Partial<CreateBenchmarkRequest>, 'active', createPayloadDefaults)
          : ({ ...values, status: 'active' } as UpdateBenchmarkRequest);

      if (mode === 'create') {
        const { benchmarkService } = await import('@/services/benchmark');
        const result = await benchmarkService.create(data as CreateBenchmarkRequest) as unknown as BenchmarkDetail;
        message.success(t('formPage.createSubmitted'));
        if (result.id) {
          navigate(`/benchmarks/${result.id}`);
        }
      } else {
        const { benchmarkService } = await import('@/services/benchmark');
        await benchmarkService.update(id!, data as UpdateBenchmarkRequest);
        message.success(t('formPage.updated'));
        navigate(`/benchmarks/${id}`);
      }
    } catch (submitError: any) {
      setError(submitError?.response?.data?.message || t('formPage.submitFailed'));
    } finally {
      setSaving(false);
    }
  }, [createPayloadDefaults, form, id, mode, navigate, t]);

  const handlePreview = useCallback(() => {
    const values = form.getFieldsValue(true);
    Modal.info({
      title: t('formPage.previewTitle'),
      width: 800,
      content: (
        <pre style={{ maxHeight: 400, overflow: 'auto', fontSize: 12 }}>
          {JSON.stringify(values, null, 2)}
        </pre>
      ),
    });
  }, [form, t]);

  useEffect(() => {
    if (mode === 'edit' && id) {
      setLoading(true);
      void import('@/services/benchmark')
        .then(({ benchmarkService }) => benchmarkService.get(id))
        .then((detail) => {
          form.setFieldsValue(detail);
          setHasUnsavedChanges(false);
        })
        .catch((loadError: any) => {
          setError(loadError?.response?.data?.message || t('formPage.loadFailed'));
        })
        .finally(() => {
          setLoading(false);
        });
      return;
    }

    form.resetFields();
    form.setFieldsValue(createInitialValues);
    setHasUnsavedChanges(false);
  }, [createInitialValues, form, id, mode]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) {
        return;
      }
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const pageTitle = useMemo(() => {
    return mode === 'create' ? t('formPage.createTitle') : t('formPage.editTitle');
  }, [mode, t]);

  if (loading) {
    return (
      <BenchmarkFormContext.Provider value={contextValue}>
        <div style={styles.PAGE_CONTAINER_STYLE}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <span>{t('formPage.loading')}</span>
          </div>
        </div>
      </BenchmarkFormContext.Provider>
    );
  }

  const configPanel = (
    <div style={configPanelStyle}>
      <Tabs
        activeKey={activeSection}
        onChange={setActiveSection}
        items={[
          { key: 'basic', label: t('formPage.tabBasic') },
          { key: 'config', label: t('formPage.tabConfig') },
          { key: 'test', label: t('formPage.tabTest') },
        ]}
        tabBarStyle={{ padding: '0 12px', marginBottom: 0 }}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={mode === 'create' ? t('formPage.createFlowTitle') : t('formPage.editFlowTitle')}
          description={
            mode === 'create'
              ? t('formPage.createFlowDesc')
              : t('formPage.editFlowDesc')
          }
        />

        <Form
          form={form}
          layout="vertical"
          initialValues={createInitialValues}
          onValuesChange={handleFormChange}
        >
          {activeSection === 'basic' && <FormSectionBasic form={form} />}
          {activeSection === 'config' && <FormSectionConfig form={form} />}
          {activeSection === 'test' && <FormSectionTest form={form} />}
        </Form>
      </div>

      <div style={actionBarStyle}>
        <Button icon={<EyeOutlined />} onClick={handlePreview}>
          {t('formPage.preview')}
        </Button>
        <Button icon={<SaveOutlined />} loading={saving} onClick={handleSaveDraft}>
          {t('formPage.saveDraft')}
        </Button>
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          loading={saving}
          onClick={handleSubmit}
        >
          {mode === 'create' ? t('formPage.createAndActivate') : t('formPage.submitUpdate')}
        </Button>
      </div>
    </div>
  );

  const editorPanel = (
    <div style={editorPanelStyle}>
      <Form form={form} layout="vertical" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <FormSectionFiles form={form} />
      </Form>
    </div>
  );

  return (
    <BenchmarkFormContext.Provider value={contextValue}>
      <div style={styles.PAGE_CONTAINER_STYLE}>
        <Breadcrumb
          style={{ marginBottom: 16 }}
          items={[
            { title: <HomeOutlined />, href: '/dashboard' },
            { title: <span>{t('formPage.breadcrumbBenchmarks')}</span>, href: '/benchmarks' },
            { title: <span>{pageTitle}</span> },
          ]}
        />

        <div style={styles.PAGE_HEADER_STYLE}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              {resolvedBackLabel}
            </Button>
            <Title level={2} style={styles.PAGE_TITLE_STYLE}>
              {pageTitle}
            </Title>
            {hasUnsavedChanges && <Tag color="orange">{t('formPage.tagUnsavedChanges')}</Tag>}
          </div>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        {banner && <div style={{ marginBottom: 16 }}>{banner}</div>}

        <Card
          style={{ borderRadius: 8, overflow: 'hidden' }}
          styles={{ body: { padding: 0, height: 'calc(100vh - 280px)', minHeight: 500 } }}
        >
          <SplitPane
            direction="horizontal"
            defaultRatio={0.4}
            minSize={0.3}
            maxSize={0.6}
            ratioPresets={[0.3, 0.4, 0.5, 0.6, 0.7]}
            onRatioChange={setSplitRatio}
          >
            {configPanel}
            {editorPanel}
          </SplitPane>
        </Card>
      </div>
    </BenchmarkFormContext.Provider>
  );
});

export default BenchmarkFormPage;

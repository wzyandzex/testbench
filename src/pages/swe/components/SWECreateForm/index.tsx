/**
 * SWE Create Form - Composite Component
 * Multi-step form themed as "developer debug task console"
 *
 * Uses compound component pattern to avoid prop drilling
 */

import { createContext, useContext, useState, useCallback, useMemo, memo } from 'react';
import i18next from 'i18next';
import type { FormStep, FormContextValue, SWECreateFormProps, StepConfig, FormState } from './types';
import type { CreateSWETaskRequest } from '@/types';

// Import sub-components
import { Steps } from './Steps';
import { RepoSection } from './RepoSection';
import { AgentSection } from './AgentSection';
import { TestSection } from './TestSection';
import { RepoPreview } from './RepoPreview';
import { Actions } from './Actions';

// ==================== Context ====================
const SWEFormContext = createContext<FormContextValue | null>(null);

export const useSWEFormContext = (): FormContextValue => {
  const context = useContext(SWEFormContext);
  if (!context) {
    throw new Error('useSWEFormContext must be used within SWECreateForm');
  }
  return context;
};

// ==================== Step Configuration ====================
export const STEP_CONFIG: StepConfig[] = [
  {
    key: 'repo',
    icon: '📦',
    get title() { return i18next.t('swe:createForm.steps.repo.title'); },
    get description() { return i18next.t('swe:createForm.steps.repo.description'); },
  },
  {
    key: 'agent',
    icon: '🤖',
    get title() { return i18next.t('swe:createForm.steps.agent.title'); },
    get description() { return i18next.t('swe:createForm.steps.agent.description'); },
  },
  {
    key: 'test',
    icon: '🧪',
    get title() { return i18next.t('swe:createForm.steps.test.title'); },
    get description() { return i18next.t('swe:createForm.steps.test.description'); },
  },
];

// ==================== Initial State ====================
const createInitialState = (
  defaultValue?: Partial<CreateSWETaskRequest>
): FormState => ({
  currentStep: 'repo',
  completedSteps: [],
  repoUrl: defaultValue?.repoUrl ?? '',
  issueNumber: defaultValue?.issueNumber ?? null,
  issueTitle: defaultValue?.issueTitle ?? '',
  issueBody: defaultValue?.issueBody ?? '',
  agentId: defaultValue?.agentId ?? null,
  testStrategy: defaultValue?.testStrategy ?? 'smart',
  maxRetries: defaultValue?.maxRetries ?? 3,
  autoFix: defaultValue?.autoFix ?? true,
  touched: new Set(),
  errors: {},
});

// ==================== Main Component ====================
export function SWECreateForm({
  onSubmit,
  defaultValue,
  agents,
  loading = false,
}: SWECreateFormProps) {
  const [state, setState] = useState<FormState>(() =>
    createInitialState(defaultValue)
  );

  // Get step index
  const getStepIndex = useCallback((step: FormStep): number => {
    return STEP_CONFIG.findIndex((s) => s.key === step);
  }, []);

  // Set current step
  const setStep = useCallback((step: FormStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  // Validate current step
  const validateCurrentStep = useCallback((): boolean => {
    const { currentStep, repoUrl, issueNumber, agentId } = state;
    let isValid = true;
    const newErrors: Partial<Record<keyof FormState, string>> = {};

    switch (currentStep) {
      case 'repo':
        if (!repoUrl) {
          (newErrors as any).repoUrl = i18next.t('swe:createForm.errors.repoUrlRequired');
          isValid = false;
        } else if (
          !/^https?:\/\/(?:www\.)?github\.com\/[^/]+\/[^/]+?(\.git)?$/.test(repoUrl)
        ) {
          (newErrors as any).repoUrl = i18next.t('swe:createForm.errors.repoUrlInvalid');
          isValid = false;
        }

        if (!issueNumber) {
          (newErrors as any).issueNumber = i18next.t('swe:createForm.errors.issueRequired');
          isValid = false;
        }
        break;

      case 'agent':
        if (!agentId) {
          (newErrors as any).agentId = i18next.t('swe:createForm.errors.agentRequired');
          isValid = false;
        }
        break;

      case 'test':
        // Test step is always valid (has defaults)
        break;
    }

    setState((prev) => ({ ...prev, errors: newErrors }));
    return isValid;
  }, [state]);

  // Check if a specific step is valid
  const isStepValid = useCallback(
    (step: FormStep): boolean => {
      switch (step) {
        case 'repo':
          return (
            !!state.repoUrl &&
            /^https?:\/\/(?:www\.)?github\.com\/[^/]+\/[^/]+?(\.git)?$/.test(state.repoUrl) &&
            !!state.issueNumber
          );
        case 'agent':
          return !!state.agentId;
        case 'test':
          return true;
      }
    },
    [state]
  );

  // Next step
  const nextStep = useCallback(() => {
    if (!validateCurrentStep()) return;

    const currentIndex = getStepIndex(state.currentStep);
    const nextIndex = currentIndex + 1;

    if (nextIndex < STEP_CONFIG.length) {
      const nextStep = STEP_CONFIG[nextIndex].key;
      setState((prev) => ({
        ...prev,
        currentStep: nextStep,
        completedSteps: [...prev.completedSteps, state.currentStep],
      }));
    }
  }, [state, getStepIndex, validateCurrentStep]);

  // Previous step
  const prevStep = useCallback(() => {
    const currentIndex = getStepIndex(state.currentStep);
    const prevIndex = currentIndex - 1;

    if (prevIndex >= 0) {
      const prevStepKey = STEP_CONFIG[prevIndex].key;
      setState((prev) => ({
        ...prev,
        currentStep: prevStepKey,
        completedSteps: prev.completedSteps.filter((s) => s !== prevStepKey),
      }));
    }
  }, [state, getStepIndex]);

  // Update field
  const updateField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setState((prev) => {
        // Clear error when field is updated
        const newErrors = { ...prev.errors };
        if (field in newErrors) {
          delete (newErrors as any)[field];
        }

        return {
          ...prev,
          [field]: value,
          errors: newErrors,
        };
      });
    },
    []
  );

  // Submit form
  const submit = useCallback(async () => {
    if (!validateCurrentStep()) return;

    const submitData: CreateSWETaskRequest = {
      repoUrl: state.repoUrl,
      issueNumber: state.issueNumber!,
      issueTitle: state.issueTitle || undefined,
      issueBody: state.issueBody || undefined,
      agentId: state.agentId!,
      testStrategy: state.testStrategy,
      maxRetries: state.maxRetries,
      autoFix: state.autoFix,
    };

    await onSubmit(submitData);
  }, [state, validateCurrentStep, onSubmit]);

  // Computed values
  const canGoNext = useMemo(() => {
    const currentIndex = getStepIndex(state.currentStep);
    return currentIndex < STEP_CONFIG.length - 1;
  }, [state.currentStep, getStepIndex]);

  const canGoBack = useMemo(() => {
    const currentIndex = getStepIndex(state.currentStep);
    return currentIndex > 0;
  }, [state.currentStep, getStepIndex]);

  // Context value
  const contextValue = useMemo<FormContextValue>(
    () => ({
      state,
      agents,
      setStep,
      nextStep,
      prevStep,
      updateField,
      validateCurrentStep,
      submit,
      isStepValid,
      getStepIndex,
      canGoNext,
      canGoBack,
    }),
    [
      state,
      agents,
      setStep,
      nextStep,
      prevStep,
      updateField,
      validateCurrentStep,
      submit,
      isStepValid,
      getStepIndex,
      canGoNext,
      canGoBack,
    ]
  );

  if (loading) {
    return null; // Or loading skeleton
  }

  return (
    <SWEFormContext.Provider value={contextValue}>
      <SWECreateFormContent />
    </SWEFormContext.Provider>
  );
}

// ==================== Content Component ====================
/**
 * Internal content component that consumes the context
 * Separated to avoid context issues with memo
 */
const SWECreateFormContent = memo(function SWECreateFormContent() {
  const { state } = useSWEFormContext();

  return (
    <div className="swe-create-form">
      {/* Step Navigation */}
      <Steps steps={STEP_CONFIG} />

      {/* Form Content */}
      <div className="swe-create-form__content">
        {state.currentStep === 'repo' && <RepoSection />}
        {state.currentStep === 'agent' && <AgentSection />}
        {state.currentStep === 'test' && <TestSection />}
      </div>

      {/* Repository Preview (shows on repo step) */}
      {state.currentStep === 'repo' && <RepoPreview />}

      {/* Action Buttons */}
      <Actions />
    </div>
  );
});

// ==================== Export Sub-Components ====================
export { Steps } from './Steps';
export { RepoSection } from './RepoSection';
export { AgentSection } from './AgentSection';
export { TestSection } from './TestSection';
export { RepoPreview } from './RepoPreview';
export { Actions } from './Actions';

// ==================== Static Component References ====================
// Allow using SWECreateForm.Steps, etc.
SWECreateForm.Steps = Steps;
SWECreateForm.RepoSection = RepoSection;
SWECreateForm.AgentSection = AgentSection;
SWECreateForm.TestSection = TestSection;
SWECreateForm.RepoPreview = RepoPreview;
SWECreateForm.Actions = Actions;

export default SWECreateForm;

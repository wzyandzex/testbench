/**
 * SWE Create Form Types
 * Type definitions for the composite form components
 */

import type { CreateSWETaskRequest, TestStrategy } from '@/types';
import type { Agent } from '@/types';

/**
 * Form steps
 */
export type FormStep = 'repo' | 'agent' | 'test';

/**
 * Step configuration
 */
export interface StepConfig {
  key: FormStep;
  title: string;
  icon: string;
  description: string;
}

/**
 * Repository information parsed from URL
 */
export interface RepoInfo {
  owner: string;
  name: string;
  fullName: string;
  url: string;
}

/**
 * Form state
 */
export interface FormState {
  // Step management
  currentStep: FormStep;
  completedSteps: FormStep[];

  // Form data
  repoUrl: string;
  issueNumber: number | null;
  issueTitle: string;
  issueBody: string;
  agentId: string | null;
  testStrategy: TestStrategy;
  maxRetries: number;
  autoFix: boolean;

  // Validation state
  touched: Set<keyof FormState>;
  errors: Partial<Record<keyof FormState, string>>;
}

/**
 * Form context value
 */
export interface FormContextValue {
  // State
  state: FormState;

  // Data
  agents: Agent[];

  // Actions
  setStep: (step: FormStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateField: <K extends keyof FormState>(field: K, value: FormState[K]) => void;
  validateCurrentStep: () => boolean;
  submit: () => Promise<void>;

  // Computed
  isStepValid: (step: FormStep) => boolean;
  getStepIndex: (step: FormStep) => number;
  canGoNext: boolean;
  canGoBack: boolean;
}

/**
 * Component props
 */
export interface SWECreateFormProps {
  onSubmit: (data: CreateSWETaskRequest) => Promise<void>;
  defaultValue?: Partial<CreateSWETaskRequest>;
  agents: Agent[];
  loading?: boolean;
}

export interface StepsProps {
  steps: StepConfig[];
}

export interface RepoSectionProps {
  value: FormState['repoUrl'];
  onChange: (value: string) => void;
  error?: string;
}

export interface AgentSectionProps {
  agents: Agent[];
  value: FormState['agentId'];
  onChange: (value: string) => void;
}

export interface TestSectionProps {
  testStrategy: TestStrategy;
  onTestStrategyChange: (value: TestStrategy) => void;
  maxRetries: number;
  onMaxRetriesChange: (value: number) => void;
  autoFix: boolean;
  onAutoFixChange: (value: boolean) => void;
}

export interface ActionsProps {
  currentStep: FormStep;
  canGoBack: boolean;
  canGoNext: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  submitting?: boolean;
  loading?: boolean;
}

/**
 * Step animation states
 */
export type StepAnimationState = 'entering' | 'entered' | 'exiting' | 'exited';

/**
 * Repository preview data (mock for now, could be fetched from GitHub API)
 */
export interface RepoPreviewData {
  stars?: number;
  forks?: number;
  issues?: number;
  language?: string;
  languageColor?: string;
  description?: string;
  updatedAt?: string;
  isCached?: boolean;
}

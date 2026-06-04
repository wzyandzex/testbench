/**
 * Cost page entry
 * Exports the main component for lazy loading
 */

export { default } from './CostPage';

// Type exports
export type {
  CostTimeRange as TimeRange,
  CostStatistics,
  ModelCostBreakdown,
  ProjectCostBreakdown,
  DailyCost,
  BudgetInfo,
  ModelCost,
  CostQueryParams,
  CostOptimizationTip,
  CreateModelCostRequest,
  UpdateModelCostRequest,
  SetBudgetRequest,
} from '@/types/cost';

// Service exports
export {
  costService,
  formatCost,
  formatTokens,
  getBudgetStatusColor,
  getBudgetStatusText,
  getPriorityColor,
  getPriorityText,
} from '@/services/cost';

// Store exports
export {
  useCostStore,
  useCostStatistics,
  useTotalCost,
  useModelCosts,
  useBudget,
  useOptimizationTips,
  useCostLoading,
  useCostActiveTab,
} from './store';

// Style exports
export { costPageStyle, getCostCSS } from './style';

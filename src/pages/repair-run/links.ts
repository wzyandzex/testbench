import type { RepairRunListParams } from '@/services/repair-run';

export type RepairRunRouteContext = Pick<
  RepairRunListParams,
  'state' | 'project_eval_run_id' | 'replay_project_eval_run_id'
> & {
  page?: number;
  create?: boolean;
  agent_id?: string;
  task_title?: string;
  task_objective?: string;
};

function normalizeString(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizePage(value?: number | null): number | undefined {
  if (!Number.isFinite(value)) {
    return undefined;
  }

  const page = Math.floor(Number(value));
  return page > 1 ? page : undefined;
}

function normalizeBoolean(value?: string | null): boolean | undefined {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return undefined;
}

export function readRepairRunRouteContext(searchParams: URLSearchParams): RepairRunRouteContext {
  const rawPage = Number(searchParams.get('page'));
  const page = Number.isFinite(rawPage) && rawPage > 1 ? Math.floor(rawPage) : undefined;
  const create = normalizeBoolean(searchParams.get('create'));

  return {
    page,
    state: normalizeString(searchParams.get('state')),
    project_eval_run_id: normalizeString(searchParams.get('project_eval_run_id')),
    replay_project_eval_run_id: normalizeString(searchParams.get('replay_project_eval_run_id')),
    create,
    agent_id: normalizeString(searchParams.get('agent_id')),
    task_title: normalizeString(searchParams.get('task_title')),
    task_objective: normalizeString(searchParams.get('task_objective')),
  };
}

export function buildRepairRunSearchParams(context?: RepairRunRouteContext): URLSearchParams {
  const searchParams = new URLSearchParams();
  const page = normalizePage(context?.page);
  const state = normalizeString(context?.state);
  const projectEvalRunID = normalizeString(context?.project_eval_run_id);
  const replayProjectEvalRunID = normalizeString(context?.replay_project_eval_run_id);

  if (page) {
    searchParams.set('page', String(page));
  }
  if (state) {
    searchParams.set('state', state);
  }
  if (projectEvalRunID) {
    searchParams.set('project_eval_run_id', projectEvalRunID);
  }
  if (replayProjectEvalRunID) {
    searchParams.set('replay_project_eval_run_id', replayProjectEvalRunID);
  }
  if (context?.create) {
    searchParams.set('create', '1');
  }
  if (context?.agent_id) {
    searchParams.set('agent_id', context.agent_id);
  }
  if (context?.task_title) {
    searchParams.set('task_title', context.task_title);
  }
  if (context?.task_objective) {
    searchParams.set('task_objective', context.task_objective);
  }

  return searchParams;
}

export function buildRepairRunListPath(context?: RepairRunRouteContext): string {
  const search = buildRepairRunSearchParams(context).toString();
  return search ? `/repair-runs?${search}` : '/repair-runs';
}

export function buildRepairRunDetailPath(runID: string, context?: RepairRunRouteContext): string {
  const normalizedRunID = normalizeString(runID);
  if (!normalizedRunID) {
    return buildRepairRunListPath(context);
  }

  const search = buildRepairRunSearchParams(context).toString();
  return search ? `/repair-runs/${normalizedRunID}?${search}` : `/repair-runs/${normalizedRunID}`;
}

export function buildProjectEvalRepairPath(projectEvalRunID?: string | null, linkedRepairRunID?: string | null): string {
  const normalizedProjectEvalRunID = normalizeString(projectEvalRunID);
  const context = normalizedProjectEvalRunID
    ? { project_eval_run_id: normalizedProjectEvalRunID }
    : undefined;

  const normalizedRepairRunID = normalizeString(linkedRepairRunID);
  if (normalizedRepairRunID) {
    return buildRepairRunDetailPath(normalizedRepairRunID, context);
  }

  return buildRepairRunListPath(context);
}

export interface ProjectEvalRepairDraftContext {
  agent_id?: string;
  task_title?: string;
  task_objective?: string;
}

export function buildProjectEvalRepairDraftPath(
  projectEvalRunID?: string | null,
  draft?: ProjectEvalRepairDraftContext,
): string {
  return buildRepairRunListPath({
    project_eval_run_id: normalizeString(projectEvalRunID),
    create: true,
    agent_id: normalizeString(draft?.agent_id),
    task_title: normalizeString(draft?.task_title),
    task_objective: normalizeString(draft?.task_objective),
  });
}

export interface RecentProjectEvalRun {
  id: string;
  status?: string;
  decision?: string;
  score?: number;
  projectType?: string;
  mode?: string;
  updatedAt?: string;
  lastVisitedAt: string;
}

const STORAGE_KEY = 'project-eval-recent-runs:v1';
const MAX_RECENT_RUNS = 8;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizeEntry(value: unknown): RecentProjectEvalRun | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = typeof record.id === 'string' ? record.id.trim() : '';
  if (!id) {
    return null;
  }

  return {
    id,
    status: typeof record.status === 'string' ? record.status : undefined,
    decision: typeof record.decision === 'string' ? record.decision : undefined,
    score: typeof record.score === 'number' ? record.score : undefined,
    projectType: typeof record.projectType === 'string' ? record.projectType : undefined,
    mode: typeof record.mode === 'string' ? record.mode : undefined,
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : undefined,
    lastVisitedAt:
      typeof record.lastVisitedAt === 'string' && record.lastVisitedAt
        ? record.lastVisitedAt
        : new Date().toISOString(),
  };
}

export function loadRecentProjectEvalRuns(): RecentProjectEvalRun[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => normalizeEntry(item))
      .filter((item): item is RecentProjectEvalRun => Boolean(item));
  } catch {
    return [];
  }
}

export function saveRecentProjectEvalRun(
  value: Omit<RecentProjectEvalRun, 'lastVisitedAt'> & { lastVisitedAt?: string }
): void {
  if (!canUseStorage()) {
    return;
  }

  const id = value.id.trim();
  if (!id) {
    return;
  }

  const nextItem: RecentProjectEvalRun = {
    ...value,
    id,
    lastVisitedAt: value.lastVisitedAt || new Date().toISOString(),
  };

  const nextItems = [nextItem, ...loadRecentProjectEvalRuns().filter((item) => item.id !== id)].slice(
    0,
    MAX_RECENT_RUNS
  );

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
  } catch {
    // Ignore local storage quota errors for this convenience feature.
  }
}

export function clearRecentProjectEvalRuns(): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

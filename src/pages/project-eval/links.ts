function normalizeProjectEvalRunID(runID?: string | null): string | null {
  const normalized = runID?.trim();
  return normalized ? normalized : null;
}

export function buildProjectEvalDetailPath(runID?: string | null): string | null {
  const normalized = normalizeProjectEvalRunID(runID);
  return normalized ? `/project-eval/${normalized}` : null;
}

export function buildProjectEvalReportPath(runID?: string | null): string | null {
  const normalized = normalizeProjectEvalRunID(runID);
  return normalized ? `/project-eval/${normalized}/report` : null;
}

export function buildProjectEvalExplainPath(runID?: string | null): string | null {
  const normalized = normalizeProjectEvalRunID(runID);
  return normalized ? `/project-eval/${normalized}/explain` : null;
}

import type {
  EvaluationScope,
  ProjectEvalDetectionInfo,
  ProjectEvalSource,
  ProjectEvalSourceIndexSummary,
  ProjectEvalSourceUpload,
  ProjectEvalSourceUploadStatus,
  ProjectType,
  RunMode,
  SourceType,
} from '@/types/api/project-eval';

const STORAGE_KEY = 'project-eval-profile-draft:v1';
const LEGACY_STORAGE_KEY = 'project-eval-create-draft:v2';
const DRAFT_VERSION = 1;

export interface ProjectEvalSourceInputDraft {
  sourceType: SourceType;
  sourceName: string;
  gitUrl: string;
  branch: string;
  commitSha: string;
  sourceUploadId: string;
  sourceUpload: ProjectEvalSourceUpload | null;
  zipObjectKey: string;
  archiveSha256: string;
  sourceProjectType?: ProjectType;
  sourceMode?: RunMode;
}

export interface ProjectEvalRunSettingsDraft {
  runMode: RunMode;
  runProjectType?: ProjectType;
  runScope: EvaluationScope;
  evaluationDepth?: string;
  projectFamily?: string;
  frameworkFamily?: string;
  templateFamily?: string;
  reportVariant?: string;
  reportVariants: string[];
  changedFiles: string[];
}

export interface ProjectEvalProfileDraft {
  version: typeof DRAFT_VERSION;
  sourceInput: ProjectEvalSourceInputDraft;
  createdSourceId: string | null;
  createdSource: ProjectEvalSource | null;
  runSettings: ProjectEvalRunSettingsDraft;
}

interface LegacyCreateDraft {
  sourceType?: SourceType;
  sourceName?: string;
  gitUrl?: string;
  branch?: string;
  commitSha?: string;
  zipObjectKey?: string;
  archiveSha256?: string;
  sourceProjectType?: ProjectType;
  sourceMode?: RunMode;
  runMode?: RunMode;
  runProjectType?: ProjectType;
  runScope?: EvaluationScope;
  changedFiles?: string[];
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function normalizeProjectTypeValue(value: unknown): ProjectType | undefined {
  switch (value) {
    case 'backend':
    case 'frontend':
    case 'llm_app':
    case 'agent':
    case 'unknown':
      return value;
    default:
      return undefined;
  }
}

function normalizeSourceTypeValue(value: unknown): SourceType {
  return value === 'zip' ? 'zip' : 'git';
}

function normalizeSourceUploadStatusValue(value: unknown): ProjectEvalSourceUploadStatus | undefined {
  switch (value) {
    case 'pending_upload':
    case 'ready':
    case 'consumed':
    case 'expired':
    case 'failed':
      return value;
    default:
      return undefined;
  }
}

function normalizeRunModeValue(value: unknown): RunMode {
  return value === 'strict' ? 'strict' : 'advisory';
}

function normalizeScopeValue(value: unknown): EvaluationScope {
  return value === 'delta' ? 'delta' : 'full';
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeOptionalString(value: unknown): string | undefined {
  const normalized = normalizeString(value);
  return normalized || undefined;
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const out: string[] = [];

  for (const item of value) {
    if (typeof item !== 'string') {
      continue;
    }

    const normalized = item.trim();
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    out.push(normalized);
  }

  return out;
}

function normalizeMetadata(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return { ...(value as Record<string, unknown>) };
}

function normalizeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function normalizeSourceIndexSummary(value: unknown): ProjectEvalSourceIndexSummary | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const status = normalizeOptionalString(record.status);
  const createdAt = normalizeOptionalString(record.created_at);

  if (!status || !createdAt) {
    return undefined;
  }

  return {
    status,
    chunk_count: normalizeNumber(record.chunk_count) ?? 0,
    file_count: normalizeNumber(record.file_count) ?? 0,
    error_message: normalizeOptionalString(record.error_message),
    build_started_at: normalizeOptionalString(record.build_started_at),
    build_completed_at: normalizeOptionalString(record.build_completed_at),
    last_updated_at: normalizeOptionalString(record.last_updated_at),
    created_at: createdAt,
  };
}

function normalizeScores(value: unknown): Record<string, number> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .map(([key, rawValue]) => {
      if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
        return [key, rawValue] as const;
      }

      if (typeof rawValue === 'string') {
        const parsed = Number(rawValue);
        if (Number.isFinite(parsed)) {
          return [key, parsed] as const;
        }
      }

      return null;
    })
    .filter((entry): entry is readonly [string, number] => Boolean(entry));

  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries);
}

function normalizeDetectionInfo(value: unknown): ProjectEvalDetectionInfo | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const normalized: ProjectEvalDetectionInfo = {
    engine: normalizeOptionalString(record.engine),
    project_type: normalizeOptionalString(record.project_type),
    confidence: normalizeOptionalString(record.confidence),
    scores: normalizeScores(record.scores),
    signals: normalizeStringList(record.signals),
    hint_used: typeof record.hint_used === 'boolean' ? record.hint_used : undefined,
    error: normalizeOptionalString(record.error),
  };

  if (
    !normalized.engine &&
    !normalized.project_type &&
    !normalized.confidence &&
    !normalized.scores &&
    (!normalized.signals || normalized.signals.length === 0) &&
    normalized.hint_used === undefined &&
    !normalized.error
  ) {
    return undefined;
  }

  return normalized;
}

function normalizeSource(value: unknown): ProjectEvalSource | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = normalizeOptionalString(record.id);
  const name = normalizeOptionalString(record.name);

  if (!id || !name) {
    return null;
  }

  return {
    id,
    organization_id: normalizeOptionalString(record.organization_id) ?? '',
    name,
    source_type: normalizeSourceTypeValue(record.source_type),
    git_url: normalizeOptionalString(record.git_url),
    branch: normalizeOptionalString(record.branch),
    commit_sha: normalizeOptionalString(record.commit_sha),
    zip_object_key: normalizeOptionalString(record.zip_object_key),
    archive_sha256: normalizeOptionalString(record.archive_sha256),
    detected_type: normalizeProjectTypeValue(record.detected_type),
    detection_info: normalizeDetectionInfo(record.detection_info),
    metadata: normalizeMetadata(record.metadata),
    created_by: normalizeOptionalString(record.created_by) ?? '',
    created_at: normalizeOptionalString(record.created_at) ?? '',
    updated_at: normalizeOptionalString(record.updated_at) ?? '',
    index: normalizeSourceIndexSummary(record.index),
  };
}

function normalizeSourceUpload(value: unknown): ProjectEvalSourceUpload | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = normalizeOptionalString(record.id);
  const sourceType = record.source_type === 'git' || record.source_type === 'zip' ? record.source_type : undefined;
  const status = normalizeSourceUploadStatusValue(record.status);
  const originalFilename = normalizeOptionalString(record.original_filename);
  const contentType = normalizeOptionalString(record.content_type);
  const sizeBytes = normalizeNumber(record.size_bytes);
  const stagedObjectKey = normalizeOptionalString(record.staged_object_key);
  const expiresAt = normalizeOptionalString(record.expires_at);
  const createdAt = normalizeOptionalString(record.created_at);
  const updatedAt = normalizeOptionalString(record.updated_at);

  if (
    !id ||
    !sourceType ||
    !status ||
    !originalFilename ||
    !contentType ||
    sizeBytes === undefined ||
    !stagedObjectKey ||
    !expiresAt ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  return {
    id,
    organization_id: normalizeOptionalString(record.organization_id) ?? '',
    created_by: normalizeOptionalString(record.created_by) ?? '',
    source_type: sourceType,
    status,
    original_filename: originalFilename,
    content_type: contentType,
    size_bytes: sizeBytes,
    archive_sha256: normalizeOptionalString(record.archive_sha256),
    staged_object_key: stagedObjectKey,
    final_object_key: normalizeOptionalString(record.final_object_key),
    source_id: normalizeOptionalString(record.source_id),
    error_message: normalizeOptionalString(record.error_message),
    expires_at: expiresAt,
    consumed_at: normalizeOptionalString(record.consumed_at),
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

function createDefaultSourceInputDraft(): ProjectEvalSourceInputDraft {
  return {
    sourceType: 'git',
    sourceName: '',
    gitUrl: '',
    branch: '',
    commitSha: '',
    sourceUploadId: '',
    sourceUpload: null,
    zipObjectKey: '',
    archiveSha256: '',
    sourceProjectType: undefined,
    sourceMode: undefined,
  };
}

function createDefaultRunSettingsDraft(): ProjectEvalRunSettingsDraft {
  return {
    runMode: 'advisory',
    runProjectType: undefined,
    runScope: 'full',
    evaluationDepth: undefined,
    projectFamily: undefined,
    frameworkFamily: undefined,
    templateFamily: undefined,
    reportVariant: undefined,
    reportVariants: [],
    changedFiles: [],
  };
}

export function createDefaultProjectEvalProfileDraft(): ProjectEvalProfileDraft {
  return {
    version: DRAFT_VERSION,
    sourceInput: createDefaultSourceInputDraft(),
    createdSourceId: null,
    createdSource: null,
    runSettings: createDefaultRunSettingsDraft(),
  };
}

function normalizeSourceInput(value: unknown): ProjectEvalSourceInputDraft {
  const defaults = createDefaultSourceInputDraft();

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return defaults;
  }

  const record = value as Record<string, unknown>;
  const sourceUpload = normalizeSourceUpload(record.sourceUpload);
  return {
    sourceType: normalizeSourceTypeValue(record.sourceType),
    sourceName: normalizeString(record.sourceName),
    gitUrl: normalizeString(record.gitUrl),
    branch: normalizeString(record.branch),
    commitSha: normalizeString(record.commitSha),
    sourceUploadId: normalizeString(record.sourceUploadId) || sourceUpload?.id || '',
    sourceUpload,
    zipObjectKey: normalizeString(record.zipObjectKey),
    archiveSha256: normalizeString(record.archiveSha256),
    sourceProjectType: normalizeProjectTypeValue(record.sourceProjectType),
    sourceMode: record.sourceMode === undefined ? undefined : normalizeRunModeValue(record.sourceMode),
  };
}

function normalizeRunSettings(value: unknown): ProjectEvalRunSettingsDraft {
  const defaults = createDefaultRunSettingsDraft();

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return defaults;
  }

  const record = value as Record<string, unknown>;
  return {
    runMode: normalizeRunModeValue(record.runMode),
    runProjectType: normalizeProjectTypeValue(record.runProjectType),
    runScope: normalizeScopeValue(record.runScope),
    evaluationDepth: normalizeOptionalString(record.evaluationDepth),
    projectFamily: normalizeOptionalString(record.projectFamily),
    frameworkFamily: normalizeOptionalString(record.frameworkFamily),
    templateFamily: normalizeOptionalString(record.templateFamily),
    reportVariant: normalizeOptionalString(record.reportVariant),
    reportVariants: normalizeStringList(record.reportVariants),
    changedFiles: normalizeStringList(record.changedFiles),
  };
}

function normalizeProfileDraft(value: unknown): ProjectEvalProfileDraft | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (record.version !== DRAFT_VERSION) {
    return null;
  }

  const createdSource = normalizeSource(record.createdSource);

  return {
    version: DRAFT_VERSION,
    sourceInput: normalizeSourceInput(record.sourceInput),
    createdSourceId: normalizeOptionalString(record.createdSourceId) ?? createdSource?.id ?? null,
    createdSource,
    runSettings: normalizeRunSettings(record.runSettings),
  };
}

function migrateLegacyDraft(value: unknown): ProjectEvalProfileDraft | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const record = value as LegacyCreateDraft;
  return {
    version: DRAFT_VERSION,
    sourceInput: {
      sourceType: normalizeSourceTypeValue(record.sourceType),
      sourceName: normalizeString(record.sourceName),
      gitUrl: normalizeString(record.gitUrl),
      branch: normalizeString(record.branch),
      commitSha: normalizeString(record.commitSha),
      sourceUploadId: '',
      sourceUpload: null,
      zipObjectKey: normalizeString(record.zipObjectKey),
      archiveSha256: normalizeString(record.archiveSha256),
      sourceProjectType: normalizeProjectTypeValue(record.sourceProjectType),
      sourceMode: record.sourceMode === undefined ? undefined : normalizeRunModeValue(record.sourceMode),
    },
    createdSourceId: null,
    createdSource: null,
    runSettings: {
      ...createDefaultRunSettingsDraft(),
      runMode: normalizeRunModeValue(record.runMode),
      runProjectType: normalizeProjectTypeValue(record.runProjectType),
      runScope: normalizeScopeValue(record.runScope),
      changedFiles: normalizeStringList(record.changedFiles),
    },
  };
}

function isDraftEmpty(draft: ProjectEvalProfileDraft): boolean {
  const { sourceInput, createdSourceId, createdSource, runSettings } = draft;

  return (
    !createdSourceId &&
    !createdSource &&
    sourceInput.sourceType === 'git' &&
    !sourceInput.sourceName &&
    !sourceInput.gitUrl &&
    !sourceInput.branch &&
    !sourceInput.commitSha &&
    !sourceInput.sourceUploadId &&
    !sourceInput.sourceUpload &&
    !sourceInput.zipObjectKey &&
    !sourceInput.archiveSha256 &&
    sourceInput.sourceProjectType === undefined &&
    sourceInput.sourceMode === undefined &&
    runSettings.runMode === 'advisory' &&
    runSettings.runProjectType === undefined &&
    runSettings.runScope === 'full' &&
    runSettings.evaluationDepth === undefined &&
    runSettings.projectFamily === undefined &&
    runSettings.frameworkFamily === undefined &&
    runSettings.templateFamily === undefined &&
    runSettings.reportVariant === undefined &&
    runSettings.reportVariants.length === 0 &&
    runSettings.changedFiles.length === 0
  );
}

export function loadProjectEvalProfileDraft(): ProjectEvalProfileDraft {
  if (!canUseStorage()) {
    return createDefaultProjectEvalProfileDraft();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const normalized = normalizeProfileDraft(JSON.parse(raw) as unknown);
      if (normalized) {
        return normalized;
      }
    }

    const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const migrated = migrateLegacyDraft(JSON.parse(legacyRaw) as unknown);
      if (migrated) {
        return migrated;
      }
    }
  } catch {
    return createDefaultProjectEvalProfileDraft();
  }

  return createDefaultProjectEvalProfileDraft();
}

export function saveProjectEvalProfileDraft(draft: ProjectEvalProfileDraft): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);

    if (isDraftEmpty(draft)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Ignore storage quota and serialization failures for this convenience draft.
  }
}

export function clearProjectEvalProfileDraft(): void {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
}

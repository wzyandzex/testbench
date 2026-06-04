import { expect, test, type Page } from '@playwright/test';

const ORG_ID = 'org-1';
const REPORT_RUN_ID = 'pe-run-1';
const PROJECT_EVAL_REPORT_PATH = `/project-eval/${REPORT_RUN_ID}/report`;

type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

function apiOk<T>(data: T): ApiEnvelope<T> {
  return {
    code: 0,
    message: 'ok',
    data,
  };
}

function buildAuthStorage() {
  return {
    state: {
      user: {
        id: 'user-1',
        username: 'demo',
        email: 'demo@example.com',
        role: 'admin',
        status: 'active',
        organizationId: ORG_ID,
        current_org_id: ORG_ID,
        current_org_role: 'admin',
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z',
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    },
    version: 0,
  };
}

function buildWorkspaceStorage() {
  return {
    state: {
      currentOrg: {
        org_id: ORG_ID,
        org_name: 'Demo Org',
        display_name: 'Demo Org',
        role: 'admin',
        joined_at: '2026-05-01T00:00:00.000Z',
        is_owner: true,
        is_default: true,
        org_type: 'team',
      },
    },
    version: 0,
  };
}

function buildReportPayload() {
  return {
    run_id: REPORT_RUN_ID,
    view_variant: 'summary',
    audience: 'engineering',
    status: 'completed',
    score: 0.62,
    decision: 'needs_fix',
    summary: 'Auth regression',
    score_mode: 'weighted',
    result_class: 'repair_recommended',
    truth_mode: 'authoritative',
    processor_profile: 'standard',
    outcome_authority_source: 'report',
    authoritative_truth: true,
    legacy_fallback_used: false,
    legacy_fallback_reason: '',
    outcome: {
      kind: 'repair',
      label: 'Repair available',
      stage: 'repair_available',
      explain: 'Repair is ready to be drafted.',
      decision: 'needs_fix',
      outcome_authority_source: 'explicit_run_outcome',
      authoritative_truth: true,
      repair_eligible: true,
      replay_eligible: false,
      next_action: 'create_linked_repair_run',
      next_action_label: 'Create or continue repair',
      next_action_reason: 'Repair is ready to be drafted.',
      refusal_reason: '',
    },
    selected_case_count: 5,
    case_selection_summary: {
      status_counts: { selected: 5 },
      reason_counts: { repair_recommended: 3 },
    },
    evidence_summary: {
      run_id: REPORT_RUN_ID,
      organization_id: ORG_ID,
      source_id: 'source-1',
      plan_version: 2,
      selected_cases: 5,
      evaluated_cases: 5,
      pass_cases: 3,
      warn_cases: 1,
      block_cases: 1,
      insufficient_cases: 0,
      average_case_score: 0.74,
      average_confidence: 0.88,
      coverage_score: 0.9,
      generated_at: '2026-05-03T00:00:00.000Z',
    },
    module_slice_execution_summary: {
      schema_version: '1',
      generated_at: '2026-05-03T00:00:00.000Z',
      module_slice_count: 1,
      ready_count: 1,
      source_backed_count: 1,
      status_counts: { completed: 1 },
      outcome_counts: { success: 1 },
      readiness_counts: { ready: 1 },
      authority_counts: { authoritative: 1 },
      validation_lane_counts: { default: 1 },
      command_execution_counts: { success: 1 },
      command_outcome_counts: { success: 1 },
      partial_result_semantics: 'full',
      requires_report_disclosure: false,
      supports_admin_stage_retry: true,
      supports_frontend_dashboard: true,
    },
    module_slice_execution_signals: [],
    mainline: {
      stage: 'repair_available',
      next_action: 'create_repair',
      primary_action: {
        action: 'create_repair',
        label: 'Create repair draft',
      },
      primary_action_reason: 'Repair is ready to be drafted.',
      available_actions: [],
      authoritative_run: true,
      repair_eligible: true,
      replay_eligible: false,
      terminal: false,
      explain: 'Repair is ready',
    },
    remediation: {
      has_linked_repair: false,
      linked_repair_count: 0,
      latest_outcome: {
        category: 'repair_recommended',
        total_cases: 5,
        improved_cases: 0,
        unchanged_cases: 4,
        regressed_cases: 1,
        pending_cases: 0,
        failed_cases: 0,
        unavailable_cases: 0,
        non_comparable_cases: 0,
        version_shifted_cases: 0,
        missing_in_replay_cases: 0,
        replay_non_authoritative_cases: 0,
      },
    },
    sections: [
      {
        id: 'summary',
        title: 'Summary',
        summary: 'Auth regression',
        severity: 'high',
        items: ['Fix login redirect'],
        metrics: {
          severity: 'high',
        },
      },
    ],
    next_actions: [
      {
        id: 'create_repair',
        label: 'Create repair',
        priority: 'p0',
        recommended: true,
        reason: 'The report is repair eligible.',
      },
      {
        id: 'review_truth_posture',
        label: 'Review truth posture',
        priority: 'p1',
        recommended: true,
        reason: 'Check evidence confidence.',
      },
    ],
    available_variants: ['summary', 'remediation'],
    export_targets: ['json', 'markdown'],
    report: {
      summary: 'Auth regression',
    },
  };
}

async function mockProjectEvalBridge(page: Page) {
  await page.addInitScript(
    ({ authStorage, workspaceStorage, currentOrgId }) => {
      localStorage.setItem('auth-storage', JSON.stringify(authStorage));
      localStorage.setItem('workspace-storage', JSON.stringify(workspaceStorage));
      localStorage.setItem('current_org_id', currentOrgId);
    },
    {
      authStorage: buildAuthStorage(),
      workspaceStorage: buildWorkspaceStorage(),
      currentOrgId: ORG_ID,
    },
  );

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    const method = request.method();

    if (method === 'GET' && pathname === '/api/v1/organizations') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          apiOk([
            {
              org_id: ORG_ID,
              org_name: 'Demo Org',
              display_name: 'Demo Org',
              role: 'admin',
              joined_at: '2026-05-01T00:00:00.000Z',
              is_owner: true,
              is_default: true,
              org_type: 'team',
            },
          ]),
        ),
      });
      return;
    }

    if (method === 'POST' && pathname === '/api/v1/user/current-organization') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          apiOk({
            access_token: 'access-token',
            refresh_token: 'refresh-token',
            membership: {
              org_id: ORG_ID,
              org_name: 'Demo Org',
              display_name: 'Demo Org',
              role: 'admin',
              joined_at: '2026-05-01T00:00:00.000Z',
              is_owner: true,
              is_default: true,
              org_type: 'team',
            },
          }),
        ),
      });
      return;
    }

    if (method === 'GET' && pathname === `/api/v1/project-evals/runs/${REPORT_RUN_ID}/report`) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiOk(buildReportPayload())),
      });
      return;
    }

    if (method === 'GET' && pathname === `/api/v1/project-evals/runs/${REPORT_RUN_ID}/stages`) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          apiOk({
            run_id: REPORT_RUN_ID,
            plan_version: 2,
            stage_count: 0,
            completed_count: 0,
            failed_count: 0,
            retryable_count: 0,
            progress_percent: 0,
            items: [],
            module_slice_execution_summary: buildReportPayload().module_slice_execution_summary,
          }),
        ),
      });
      return;
    }

    if (method === 'GET' && pathname === '/api/v1/repair-runs') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          apiOk({
            page: 1,
            page_size: 10,
            total: 0,
            items: [],
          }),
        ),
      });
      return;
    }

    if (method === 'POST' && pathname === '/api/v1/repair-runs') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          apiOk({
            id: 'repair-run-1',
            organization_id: ORG_ID,
            user_id: 'user-1',
            agent_id: 'agent-1',
            state: 'created',
            replay_status: 'not_requested',
            retryable: true,
            created_at: '2026-05-03T00:00:00.000Z',
            updated_at: '2026-05-03T00:00:00.000Z',
          }),
        ),
      });
      return;
    }

    throw new Error(`Unhandled API request in Project Eval bridge test: ${method} ${pathname}`);
  });
}

test.describe('Project Eval repair draft bridge', () => {
  test('opens a prefilled Repair draft from the report next action', async ({ page }) => {
    await mockProjectEvalBridge(page);

    await page.goto(PROJECT_EVAL_REPORT_PATH);

    await expect(page.getByTestId('project-eval-outcome-card')).toBeVisible();
    await expect(page.getByTestId('project-eval-next-action-create_repair')).toBeVisible();
    await page.getByTestId('project-eval-next-action-create_repair').click();

    await expect(page).toHaveURL(/\/repair-runs\?(?=.*project_eval_run_id=pe-run-1)(?=.*create=1)/);
    await expect(page.getByTestId('repair-run-create-modal')).toBeVisible();
    await expect(page.getByTestId('repair-run-task-title-input')).toHaveValue('Repair 草稿：Auth regression');
    await expect(page.getByTestId('repair-run-task-objective-input')).toHaveValue(/Auth regression/);
    await expect(page.getByTestId('repair-run-task-objective-input')).toHaveValue(/主线判断：可直接创建 Repair 草稿。/);
  });
});

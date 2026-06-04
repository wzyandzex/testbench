import { expect, test, type Page } from '@playwright/test';

type FullstackSmokeConfig = {
  configured: boolean;
  message: string;
  username: string;
  password: string;
  benchmarkID: string;
  preferredAgentID: string;
};

function resolveSmokeConfig(): FullstackSmokeConfig {
  const username = process.env.E2E_FULLSTACK_USERNAME?.trim() || '';
  const password = process.env.E2E_FULLSTACK_PASSWORD?.trim() || '';
  const benchmarkID = process.env.E2E_BENCHMARK_ID?.trim() || '';
  const preferredAgentID = process.env.E2E_AGENT_ID?.trim() || '';

  const missing = [
    !username ? 'E2E_FULLSTACK_USERNAME' : '',
    !password ? 'E2E_FULLSTACK_PASSWORD' : '',
    !benchmarkID ? 'E2E_BENCHMARK_ID' : '',
  ].filter(Boolean);

  return {
    configured: missing.length === 0,
    message: missing.length === 0
      ? 'configured'
      : `Missing environment variables: ${missing.join(', ')}`,
    username,
    password,
    benchmarkID,
    preferredAgentID,
  };
}

async function waitForExecutionListResponse(page: Page, benchmarkID: string) {
  return page.waitForResponse((response) => (
    response.request().method() === 'GET'
    && response.url().includes(`/api/v1/benchmarks/${benchmarkID}/executions`)
    && response.status() === 200
  ));
}

async function selectPreferredAgent(page: Page, preferredAgentID: string) {
  const agentField = page.getByTestId('benchmark-run-agent-field');
  const agentOptionSuffix = preferredAgentID.slice(0, 8);
  const selectedValue = agentField.locator('.ant-select-selection-item');

  if (await selectedValue.count()) {
    const selectedText = (await selectedValue.first().textContent()) || '';
    if (selectedText.includes(agentOptionSuffix)) {
      return;
    }
  }

  await agentField.locator('.ant-select-selector').click();
  await page.locator('.ant-select-dropdown .ant-select-item-option-content').filter({
    hasText: `(${agentOptionSuffix})`,
  }).first().click();
}

const smokeConfig = resolveSmokeConfig();

test.describe('fullstack benchmark run smoke', () => {
  test.skip(!smokeConfig.configured, smokeConfig.message);

  test('logs in and launches a benchmark-owned run from the real UI', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByTestId('auth-login-username')).toBeVisible();
    await page.getByTestId('auth-login-username').fill(smokeConfig.username);
    await page.getByTestId('auth-login-password').fill(smokeConfig.password);

    await Promise.all([
      page.waitForURL((url) => !url.pathname.startsWith('/login') && !url.pathname.startsWith('/auth'), { timeout: 30_000 }),
      page.getByTestId('auth-login-submit').click(),
    ]);

    await expect.poll(async () => (
      page.evaluate(() => Boolean(localStorage.getItem('auth-storage')))
    )).toBe(true);

    const initialExecutionsResponse = waitForExecutionListResponse(page, smokeConfig.benchmarkID);
    await page.goto(`/benchmarks/${smokeConfig.benchmarkID}`);
    await initialExecutionsResponse;

    await expect(page.getByTestId('benchmark-run-open')).toBeVisible();
    await page.getByTestId('benchmark-history-tab').click();
    await expect(page.getByTestId('benchmark-history-table')).toBeVisible();

    await page.getByTestId('benchmark-run-open').click();
    await expect(page.getByTestId('benchmark-run-modal')).toBeVisible();

    const noAgentsWarning = page.getByTestId('benchmark-run-no-agents');
    if (await noAgentsWarning.isVisible()) {
      throw new Error('No active agents are available for the current organization.');
    }

    if (smokeConfig.preferredAgentID) {
      await selectPreferredAgent(page, smokeConfig.preferredAgentID);
    }

    const launchResponsePromise = page.waitForResponse((response) => (
      response.request().method() === 'POST'
      && response.url().includes(`/api/v1/benchmarks/${smokeConfig.benchmarkID}/runs`)
      && response.status() === 200
    ));
    const refreshedExecutionsResponse = waitForExecutionListResponse(page, smokeConfig.benchmarkID);

    await page.getByTestId('benchmark-run-submit').click();

    await launchResponsePromise;
    await refreshedExecutionsResponse;

    await expect(page.getByTestId('benchmark-run-receipt')).toBeVisible();
    await expect(page.getByTestId('benchmark-run-receipt')).toContainText('Task ID:');
    await expect(page.getByTestId('benchmark-run-receipt')).toContainText('benchmark-owned contract');
  });
});

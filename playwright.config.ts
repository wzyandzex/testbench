import { defineConfig } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';
const browserChannel = process.env.PLAYWRIGHT_BROWSER_CHANNEL || 'msedge';
const headless = process.env.PLAYWRIGHT_HEADED === '1' ? false : true;
const shouldStartWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER !== '1';
const videoMode = process.env.PLAYWRIGHT_VIDEO === '1' ? 'retain-on-failure' : 'off';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120_000,
  expect: {
    timeout: 20_000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    baseURL,
    channel: browserChannel,
    headless,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: videoMode,
  },
  webServer: shouldStartWebServer ? {
    command: 'npm.cmd run dev:e2e',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  } : undefined,
});

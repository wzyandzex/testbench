import { expect, test, type Page } from '@playwright/test';

const ORG_ID = 'org-ws-toast';
const USER_ID = 'user-ws-toast';
const ACCESS_TOKEN = 'persisted-access-token-for-ws-toast';
const REFRESH_TOKEN = 'persisted-refresh-token-for-ws-toast';
const EVENT_MESSAGE = 'E2E terminal completion toast';

interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

interface SubscribeRequest {
  action?: string;
  event?: string;
  filters?: Record<string, unknown>;
  subscription_id?: string;
}

interface RoutedWebSocket {
  send(message: string | Buffer): void;
  onMessage(handler: (message: string | Buffer) => unknown): void;
  onClose(handler: (code: number | undefined, reason: string | undefined) => unknown): void;
  url(): string;
}

function apiOk<T>(data: T): ApiEnvelope<T> {
  return {
    code: 0,
    message: 'ok',
    data,
  };
}

function buildMembership() {
  return {
    org_id: ORG_ID,
    org_name: 'WS Toast Org',
    display_name: 'WS Toast Org',
    role: 'admin',
    joined_at: '2026-05-01T00:00:00.000Z',
    is_owner: true,
    is_default: true,
    org_type: 'team',
  };
}

function buildAuthStorage() {
  return {
    state: {
      user: {
        id: USER_ID,
        username: 'ws-toast-user',
        email: 'ws-toast@example.com',
        role: 'admin',
        status: 'active',
        organizationId: ORG_ID,
        current_org_id: ORG_ID,
        current_org_role: 'admin',
        orgRole: 'admin',
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z',
      },
      accessToken: ACCESS_TOKEN,
      refreshToken: REFRESH_TOKEN,
    },
    version: 0,
  };
}

function buildWorkspaceStorage() {
  const membership = buildMembership();

  return {
    state: {
      currentOrg: membership,
      memberships: [membership],
      isSwitching: false,
      isInitialized: true,
      error: null,
    },
    version: 0,
  };
}

async function prepareAuthenticatedWorkspace(page: Page) {
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
}

async function mockMinimalApis(page: Page) {
  let pendingCountRequests = 0;

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());
    const method = request.method();

    if (method === 'GET' && pathname === '/api/v1/organizations') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiOk([buildMembership()])),
      });
      return;
    }

    if (method === 'GET' && pathname === '/api/v1/history/pending-count') {
      pendingCountRequests += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(apiOk({ count: pendingCountRequests })),
      });
      return;
    }

    throw new Error(`Unhandled API request in WebSocket terminal toast test: ${method} ${pathname}`);
  });

  return {
    getPendingCountRequests: () => pendingCountRequests,
  };
}

test.describe('WebSocket terminal event toasts', () => {
  test('subscribes with persisted auth and shows a global toast for a produced task completion event', async ({ page }) => {
    await prepareAuthenticatedWorkspace(page);
    const apiMock = await mockMinimalApis(page);

    let activeSocket: RoutedWebSocket | null = null;
    let observedWsUrl = '';
    let resolveSubscribeRequest: (request: SubscribeRequest) => void = () => {};
    const subscribeRequestPromise = new Promise<SubscribeRequest>((resolve) => {
      resolveSubscribeRequest = resolve;
    });

    await page.routeWebSocket(/\/ws\?token=/, (ws) => {
      activeSocket = ws;
      observedWsUrl = ws.url();

      ws.onMessage((message) => {
        const raw = typeof message === 'string' ? message : message.toString();
        const parsed = JSON.parse(raw) as SubscribeRequest;

        if (parsed.action === 'subscribe' || parsed.event === 'subscribe') {
          resolveSubscribeRequest(parsed);
        }
      });

      ws.onClose(() => {
        activeSocket = null;
      });
    });

    await page.goto('/organizations');

    const subscribeRequest = await Promise.race([
      subscribeRequestPromise,
      page.waitForTimeout(10_000).then(() => { throw new Error('Timed out waiting for the global WebSocket subscribe request.'); }),
    ]);
    expect(new URL(observedWsUrl).searchParams.get('token')).toBe(ACCESS_TOKEN);
    expect(subscribeRequest.filters).toEqual({
      user_id: USER_ID,
      event_types: ['task.completed', 'task.failed', 'batch.completed', 'batch.failed'],
    });
    expect(subscribeRequest.filters).not.toHaveProperty('local_key');

    expect(activeSocket).not.toBeNull();
    activeSocket?.send(JSON.stringify({
      type: 'task.completed',
      priority: 'normal',
      message: EVENT_MESSAGE,
      timestamp: '2026-05-27T08:00:00.000Z',
      data: {
        organization_id: ORG_ID,
        user_id: USER_ID,
        task_id: 'execution-toast-1234567890',
        message: EVENT_MESSAGE,
      },
    }));

    await expect(page.locator('.ant-notification-notice').filter({ hasText: EVENT_MESSAGE })).toBeVisible();
    await expect.poll(apiMock.getPendingCountRequests).toBeGreaterThanOrEqual(2);
  });
});

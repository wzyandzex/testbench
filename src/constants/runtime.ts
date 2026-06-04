function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function currentBrowserHost(): string {
  if (typeof window === 'undefined') {
    return 'localhost:3000';
  }
  return window.location.host;
}

function currentWebSocketProtocol(): string {
  if (typeof window === 'undefined') {
    return 'ws:';
  }
  return window.location.protocol === 'https:' ? 'wss:' : 'ws:';
}

function buildBrowserWebSocketUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${currentWebSocketProtocol()}//${currentBrowserHost()}${normalizedPath}`;
}

function resolveApiBaseUrl(rawValue?: string): string {
  const value = rawValue?.trim();
  if (!value) {
    return '/api/v1';
  }
  return trimTrailingSlash(value);
}

function resolveApiWebSocketBaseUrl(apiBaseUrl: string): string {
  if (apiBaseUrl.startsWith('http://') || apiBaseUrl.startsWith('https://')) {
    const url = new URL(apiBaseUrl);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return trimTrailingSlash(url.toString());
  }
  return buildBrowserWebSocketUrl(apiBaseUrl);
}

function resolveWebSocketBaseUrl(rawValue?: string): string {
  const value = rawValue?.trim();
  if (!value) {
    return buildBrowserWebSocketUrl('/ws');
  }
  if (value.startsWith('ws://') || value.startsWith('wss://')) {
    return trimTrailingSlash(value);
  }
  if (value.startsWith('http://') || value.startsWith('https://')) {
    const url = new URL(value);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return trimTrailingSlash(url.toString());
  }
  return buildBrowserWebSocketUrl(value);
}

function parseBooleanFlag(rawValue: string | undefined, defaultValue: boolean): boolean {
  if (!rawValue) {
    return defaultValue;
  }
  switch (rawValue.trim().toLowerCase()) {
    case '1':
    case 'true':
    case 'yes':
    case 'on':
      return true;
    case '0':
    case 'false':
    case 'no':
    case 'off':
      return false;
    default:
      return defaultValue;
  }
}

export const runtimeConfig = {
  apiBaseUrl: resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  apiWebSocketBaseUrl: resolveApiWebSocketBaseUrl(resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL)),
  notifierWebSocketBaseUrl: resolveWebSocketBaseUrl(import.meta.env.VITE_WS_BASE_URL),
  features: {
    legacySWEEnabled: parseBooleanFlag(import.meta.env.VITE_ENABLE_LEGACY_SWE, false),
  },
} as const;

export function buildApiWebSocketUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${runtimeConfig.apiWebSocketBaseUrl}${normalizedPath}`;
}

const STORAGE_KEY = 'packly.apiKey';

export function getStoredApiKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setStoredApiKey(value: string) {
  if (typeof window === 'undefined') return;
  try {
    if (value) {
      localStorage.setItem(STORAGE_KEY, value);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore quota / private mode
  }
}

export function authHeaders(extra: HeadersInit = {}): HeadersInit {
  const key = getStoredApiKey();
  const headers = new Headers(extra);
  if (key) {
    headers.set('X-API-Key', key);
  }
  return headers;
}

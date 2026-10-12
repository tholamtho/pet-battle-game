import { env } from '@/config/env.js';

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = data?.error?.code;
    this.data = data;
  }
}

let authToken = null;
let unauthorizedHandler = null;
export const setAuthToken = (token) => (authToken = token);
/** Called when the server rejects our token (expired/invalid), so the app can go back to login. */
export const setUnauthorizedHandler = (fn) => (unauthorizedHandler = fn);

/** Thin fetch wrapper: base URL, JSON, bearer token, timeout, typed errors. */
export async function request(path, { method = 'GET', body, timeout = 10_000, signal } = {}) {
  if (!env.apiUrl) throw new ApiError('API is not configured (set VITE_API_URL)', { status: 0 });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  signal?.addEventListener('abort', () => ctrl.abort());

  try {
    const res = await fetch(`${env.apiUrl}${path}`, {
      method,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status === 401 && authToken) unauthorizedHandler?.();
      throw new ApiError(data?.error?.message || res.statusText, { status: res.status, data });
    }
    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err.name === 'AbortError') throw new ApiError('Request timed out', { status: 0 });
    throw new ApiError(err.message, { status: 0 });
  } finally {
    clearTimeout(timer);
  }
}

export const http = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};

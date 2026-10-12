const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// ws://host/ws is derived from the API url unless VITE_WS_URL is set explicitly.
const derivedWs = apiUrl ? apiUrl.replace(/^http/, 'ws').replace(/\/api\/v\d+$/, '') + '/ws' : '';

export const env = Object.freeze({
  apiUrl,
  wsUrl: import.meta.env.VITE_WS_URL || derivedWs,
  isDev: import.meta.env.DEV,
  baseUrl: import.meta.env.BASE_URL,
});

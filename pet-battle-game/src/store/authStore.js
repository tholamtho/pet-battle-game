import { setAuthToken } from '@/api/httpClient.js';

const KEY = 'pet-battle:auth';

/** Keeps the login token across reloads. Storage can throw (private mode), so every access is guarded. */
export const authStore = {
  token: null,
  user: null,

  init() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved?.token) this.set(saved.token, saved.user);
    } catch {
      /* ignore */
    }
  },

  set(token, user) {
    this.token = token;
    this.user = user;
    setAuthToken(token);
    try {
      localStorage.setItem(KEY, JSON.stringify({ token, user }));
    } catch {
      /* ignore */
    }
  },

  clear() {
    this.token = null;
    this.user = null;
    setAuthToken(null);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  },
};

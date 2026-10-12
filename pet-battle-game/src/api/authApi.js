import { http } from './httpClient.js';
import { authStore } from '@/store/authStore.js';

async function authenticate(path, username, password) {
  const { token, user } = await http.post(path, { username, password });
  authStore.set(token, user);
  return user;
}

export const authApi = {
  login: (username, password) => authenticate('/auth/login', username, password),
  register: (username, password) => authenticate('/auth/register', username, password),
  logout: () => authStore.clear(),
};

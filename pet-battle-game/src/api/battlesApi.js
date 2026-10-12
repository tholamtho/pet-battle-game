import { http } from './httpClient.js';

export const battlesApi = {
  active: () => http.get('/battles/active'),
  startPve: (body = {}) => http.post('/battles/pve', body),
  turn: (id, skillId) => http.post(`/battles/${id}/turn`, { skillId }),
  forfeit: (id) => http.post(`/battles/${id}/forfeit`),
};

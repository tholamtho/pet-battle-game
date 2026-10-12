import { http } from './httpClient.js';

export const playersApi = {
  me: () => http.get('/players/me'),
  chooseStarter: (speciesId) => http.post('/players/starter', { speciesId }),
};

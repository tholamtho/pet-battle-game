import { http } from './httpClient.js';

export const eggsApi = {
  list: () => http.get('/eggs'),
  incubate: (itemId) => http.post('/eggs/incubate', { itemId }),
  speedup: (id, itemId) => http.post(`/eggs/${id}/speedup`, { itemId }),
  hatch: (id) => http.post(`/eggs/${id}/hatch`),
};

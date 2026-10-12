import { http } from './httpClient.js';

export const inventoryApi = {
  list: () => http.get('/inventory'),
  /** exp candy etc. */
  use: (itemId, petId, quantity = 1) => http.post('/inventory/use', { itemId, petId, quantity }),
};

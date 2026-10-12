import { http } from './httpClient.js';

export const shopApi = {
  list: () => http.get('/shop'),
  buy: (itemId, quantity = 1) => http.post('/shop/buy', { itemId, quantity }),
};

import { http } from './httpClient.js';

export const mapsApi = {
  list: () => http.get('/maps'),
  enter: (id) => http.post(`/maps/${id}/enter`),
};

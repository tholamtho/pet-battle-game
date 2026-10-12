import { http } from './httpClient.js';

export const petsApi = {
  list: () => http.get('/pets'),
  get: (id) => http.get(`/pets/${id}`),
  rename: (id, nickname) => http.patch(`/pets/${id}`, { nickname }),
  setTeam: (petIds) => http.put('/pets/team', { petIds }),
  release: (id) => http.delete(`/pets/${id}`),
  evolve: (id) => http.post(`/pets/${id}/evolve`),
  equip: (id, slot, itemId) => http.put(`/pets/${id}/equipment/${slot}`, { itemId }),
  unequip: (id, slot) => http.delete(`/pets/${id}/equipment/${slot}`),
};

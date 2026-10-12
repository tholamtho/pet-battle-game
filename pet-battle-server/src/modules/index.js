import { Router } from 'express';
import auth from './auth/auth.routes.js';
import players from './players/players.routes.js';
import species from './species/species.routes.js';
import catalog from './catalog/catalog.routes.js';
import pets from './pets/pets.routes.js';
import maps from './maps/maps.routes.js';
import battles from './battle/battles.routes.js';
import inventory from './inventory/inventory.routes.js';
import equipment from './equipment/equipment.routes.js';
import eggs from './eggs/eggs.routes.js';
import shop from './shop/shop.routes.js';

// Mount modules explicitly (no magic auto-loading): easy to grep, easy to reorder.
// Realtime PvP lives in src/realtime (WebSocket). Planned: inventory, shop, quests, friends.
export function buildApiRouter() {
  const api = Router();
  api.use('/auth', auth);
  api.use('/players', players);
  api.use('/catalog', catalog);
  api.use('/species', species);
  api.use('/pets', equipment); // /pets/:id/equipment/:slot
  api.use('/pets', pets);
  api.use('/maps', maps);
  api.use('/battles', battles);
  api.use('/inventory', inventory);
  api.use('/eggs', eggs);
  api.use('/shop', shop);
  return api;
}

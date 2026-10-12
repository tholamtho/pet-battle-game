import { withTransaction } from '../../db/pool.js';
import { badRequest, conflict } from '../../common/errors.js';
import { getCatalog } from '../catalog/catalog.service.js';
import * as playersRepo from '../players/players.repo.js';
import * as inventoryRepo from '../inventory/inventory.repo.js';

export const list = () => [...getCatalog().items.values()].filter((i) => i.price != null).map((i) => ({ itemId: i.id, price: i.price }));

export function buy(userId, itemId, quantity) {
  return withTransaction(async (db) => {
    const item = getCatalog().items.get(itemId);
    if (!item || item.price == null) throw badRequest('That item is not for sale');
    if (!(await playersRepo.spendGold(userId, item.price * quantity, db))) throw conflict('Not enough gold');
    await inventoryRepo.add(userId, itemId, quantity, db);
    return { itemId, quantity, gold: (await playersRepo.findByUserId(userId, db)).gold };
  });
}

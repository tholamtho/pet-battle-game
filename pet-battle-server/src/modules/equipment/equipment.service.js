import { withTransaction } from '../../db/pool.js';
import { badRequest, conflict } from '../../common/errors.js';
import { getCatalog } from '../catalog/catalog.service.js';
import * as inventoryRepo from '../inventory/inventory.repo.js';
import * as petsService from '../pets/pets.service.js';
import * as repo from './equipment.repo.js';

/** Equipping moves one copy from the bag onto the pet; whatever was there goes back to the bag. */
export function equip(userId, petId, slot, itemId) {
  return withTransaction(async (db) => {
    await petsService.assertOwned(userId, petId, db);
    const item = getCatalog().items.get(itemId);
    if (item?.type !== 'equipment') throw badRequest('That item is not equipment');
    if (item.slot !== slot) throw badRequest(`${item.name} goes in the ${item.slot} slot`);

    const previous = await repo.get(petId, slot, db);
    if (!(await inventoryRepo.remove(userId, itemId, 1, db))) throw conflict('You do not own this item');
    if (previous) await inventoryRepo.add(userId, previous, 1, db);
    await repo.set(petId, slot, itemId, db);
    return petsService.get(userId, petId, db);
  });
}

export function unequip(userId, petId, slot) {
  return withTransaction(async (db) => {
    await petsService.assertOwned(userId, petId, db);
    const previous = await repo.get(petId, slot, db);
    if (previous) {
      await repo.clear(petId, slot, db);
      await inventoryRepo.add(userId, previous, 1, db);
    }
    return petsService.get(userId, petId, db);
  });
}

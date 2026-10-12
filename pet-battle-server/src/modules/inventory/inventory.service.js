import { withTransaction } from '../../db/pool.js';
import { badRequest, conflict } from '../../common/errors.js';
import { getCatalog } from '../catalog/catalog.service.js';
import * as petsService from '../pets/pets.service.js';
import * as repo from './inventory.repo.js';

export const list = (userId) => repo.list(userId);

export async function grant(userId, itemId, quantity, db) {
  if (!getCatalog().items.has(itemId)) throw badRequest(`Unknown item ${itemId}`);
  await repo.add(userId, itemId, quantity, db);
}

export async function consume(userId, itemId, quantity, db) {
  if (!(await repo.remove(userId, itemId, quantity, db))) {
    throw conflict(`You do not have enough ${getCatalog().items.get(itemId)?.name ?? itemId}`);
  }
}

/** Exp candy and similar: consumables with effect.exp, used on a pet. */
export function useOnPet(userId, { itemId, petId, quantity }) {
  return withTransaction(async (db) => {
    const item = getCatalog().items.get(itemId);
    if (item?.type !== 'consumable' || !item.effect?.exp) throw badRequest('This item cannot be used on a pet');
    await petsService.assertOwned(userId, petId, db);
    await consume(userId, itemId, quantity, db);
    const progress = await petsService.addExp(userId, petId, item.effect.exp * quantity, db);
    return { progress, pet: await petsService.get(userId, petId, db) };
  });
}

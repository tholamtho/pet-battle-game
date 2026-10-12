import { withTransaction } from '../../db/pool.js';
import { badRequest, conflict, notFound } from '../../common/errors.js';
import { pickWeighted } from '../../common/random.js';
import { getCatalog } from '../catalog/catalog.service.js';
import * as playersRepo from '../players/players.repo.js';
import * as petsService from '../pets/pets.service.js';
import * as inventoryService from '../inventory/inventory.service.js';
import * as repo from './eggs.repo.js';

export async function list(userId) {
  const player = await playersRepo.findByUserId(userId);
  return { slots: player.incubatorSlots, eggs: await repo.list(userId) };
}

export function incubate(userId, itemId) {
  return withTransaction(async (db) => {
    const item = getCatalog().items.get(itemId);
    if (item?.type !== 'egg') throw badRequest('That item is not an egg');
    await playersRepo.lock(userId, db); // serialises concurrent incubate calls
    const player = await playersRepo.findByUserId(userId, db);
    if ((await repo.count(userId, db)) >= player.incubatorSlots) throw conflict('All incubators are busy');
    await inventoryService.consume(userId, itemId, 1, db);
    return repo.insert({ ownerId: userId, itemId, seconds: item.hatchSeconds }, db);
  });
}

export function speedup(userId, eggId, itemId) {
  return withTransaction(async (db) => {
    const egg = await repo.findOwned(eggId, userId, db, { forUpdate: true });
    if (!egg) throw notFound('Egg');
    const item = getCatalog().items.get(itemId);
    const seconds = item?.effect?.hatchSeconds;
    if (!seconds) throw badRequest('That item cannot speed up an egg');
    if (egg.remainingSeconds <= 0) throw conflict('This egg is ready to hatch');
    await inventoryService.consume(userId, itemId, 1, db);
    await repo.shorten(eggId, seconds, db);
    return repo.findOwned(eggId, userId, db);
  });
}

/** Rolls the species from the egg's pool at hatch time, grants a level 1 pet and removes the egg. */
export function hatch(userId, eggId, rng = Math.random) {
  return withTransaction(async (db) => {
    const egg = await repo.findOwned(eggId, userId, db, { forUpdate: true });
    if (!egg) throw notFound('Egg');
    if (egg.remainingSeconds > 0) throw conflict(`Not ready yet: ${egg.remainingSeconds}s left`);
    const pool = await repo.poolFor(egg.itemId, db);
    if (!pool.length) throw conflict('This egg has no hatch pool configured');
    const { speciesId } = pickWeighted(pool, rng);
    const pet = await petsService.grantPet(userId, { speciesId, level: 1 }, db);
    await repo.remove(eggId, db);
    return { pet };
  });
}

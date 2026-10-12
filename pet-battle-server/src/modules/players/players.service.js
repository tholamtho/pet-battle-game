import { withTransaction } from '../../db/pool.js';
import { badRequest, conflict, notFound } from '../../common/errors.js';
import * as speciesRepo from '../species/species.repo.js';
import * as petsRepo from '../pets/pets.repo.js';
import * as petsService from '../pets/pets.service.js';
import { getCatalog } from '../catalog/catalog.service.js';
import * as inventoryRepo from '../inventory/inventory.repo.js';
import * as repo from './players.repo.js';

// Welcome gifts. Skipped for items the catalog doesn't have (e.g. seeds not run yet).
const STARTER_KIT = [['egg_common', 1], ['exp_candy_s', 3], ['incubator_boost', 1]];

export async function createProfile(userId, db) {
  await repo.create(userId, db);
  for (const [itemId, qty] of STARTER_KIT) {
    if (getCatalog().items.has(itemId)) await inventoryRepo.add(userId, itemId, qty, db);
  }
}

export async function getMe(userId) {
  const player = await repo.findByUserId(userId);
  if (!player) throw notFound('Player');
  return { ...player, petCount: await petsRepo.countByOwner(userId) };
}

export function chooseStarter(userId, speciesId) {
  return withTransaction(async (db) => {
    await repo.lock(userId, db);
    if ((await petsRepo.countByOwner(userId, db)) > 0) throw conflict('Starter already chosen');
    const species = await speciesRepo.findById(speciesId, db);
    if (!species?.isStarter) throw badRequest('That species is not a starter');
    return petsService.grantPet(userId, { speciesId, level: 5 }, db);
  });
}

import { conflict, forbidden, notFound } from '../../common/errors.js';
import * as playersRepo from '../players/players.repo.js';
import * as repo from './maps.repo.js';
import { rollEncounter } from './encounter.js';

async function requirePlayer(userId) {
  const player = await playersRepo.findByUserId(userId);
  if (!player) throw notFound('Player');
  return player;
}

export async function list(userId) {
  const player = await requirePlayer(userId);
  return (await repo.list()).map((m) => ({ ...m, unlocked: player.level >= m.minLevel }));
}

export async function get(userId, mapId) {
  const [player, map] = await Promise.all([requirePlayer(userId), repo.findById(mapId)]);
  if (!map) throw notFound('Map');
  return { ...map, unlocked: player.level >= map.minLevel, encounters: await repo.listEncounters(mapId) };
}

export async function enter(userId, mapId) {
  const [player, map] = await Promise.all([requirePlayer(userId), repo.findById(mapId)]);
  if (!map) throw notFound('Map');
  if (player.level < map.minLevel) throw forbidden(`Requires player level ${map.minLevel}`);
  await playersRepo.setCurrentMap(userId, mapId);
  return { ...map, unlocked: true };
}

/** Rolls a wild pet on the player's current map. The battle module will consume this later. */
export async function encounter(userId, mapId) {
  const player = await requirePlayer(userId);
  if (player.currentMapId !== mapId) throw conflict('Enter the map first');
  const encounters = await repo.listEncounters(mapId);
  if (!encounters.length) throw conflict('Nothing to encounter on this map');
  return { mapId, wild: rollEncounter(encounters) };
}

import { DEFAULT_SOCKETS } from './config.js';

const add3 = (a = [0, 0, 0], b = [0, 0, 0]) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/**
 * Where does an equipped item go on a pet?
 *  - pet config  sockets[slot] = { bone?, offset?, rotation?, scale? }   (set once per species)
 *  - item config { offset, rotation, scale }                             (set once per item)
 * With a bone the offsets are in that bone's local space (it follows the animation).
 * Without one they are in the pet's root space, starting from the slot's default position.
 */
export function resolveSocket(slot, petConfig = {}, itemConfig = {}) {
  const socket = petConfig.sockets?.[slot];
  const base = socket?.bone ? socket : { ...DEFAULT_SOCKETS[slot], ...(socket || {}) };
  return {
    bone: socket?.bone ?? null,
    position: add3(base.offset, itemConfig.offset),
    rotation: add3(socket?.rotation, itemConfig.rotation),
    scale: (socket?.scale ?? 1) * (itemConfig.scale ?? 1),
  };
}

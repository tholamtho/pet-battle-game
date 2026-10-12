import { describe, it, expect } from 'vitest';
import { resolveSocket } from '@/render/animation/sockets.js';
import { DEFAULT_SOCKETS } from '@/render/animation/config.js';

describe('resolveSocket', () => {
  it('uses the slot default when the pet defines nothing', () => {
    const s = resolveSocket('head', {}, {});
    expect(s).toEqual({ bone: null, position: DEFAULT_SOCKETS.head.offset, rotation: [0, 0, 0], scale: 1 });
  });
  it('adds the item offset/rotation and multiplies scale', () => {
    const pet = { sockets: { head: { offset: [0, 2, 0], rotation: [0.1, 0, 0], scale: 2 } } };
    const s = resolveSocket('head', pet, { offset: [0, 0.5, 0], rotation: [0, 0.2, 0], scale: 0.5 });
    expect(s.position).toEqual([0, 2.5, 0]);
    expect(s.rotation).toEqual([0.1, 0.2, 0]);
    expect(s.scale).toBe(1);
  });
  it('a bone socket is bone-local: no slot default is mixed in', () => {
    const s = resolveSocket('head', { sockets: { head: { bone: 'Head' } } }, { offset: [0, 0.1, 0] });
    expect(s.bone).toBe('Head');
    expect(s.position).toEqual([0, 0.1, 0]);
  });
});

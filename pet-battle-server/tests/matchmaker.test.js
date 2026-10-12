import { describe, it, expect, vi } from 'vitest';
import { Matchmaker } from '../src/realtime/matchmaker.js';

describe('Matchmaker', () => {
  it('pairs two players in order and empties the queue', () => {
    const onMatch = vi.fn();
    const mm = new Matchmaker(onMatch);
    mm.join({ userId: 'a', petId: '1' });
    expect(onMatch).not.toHaveBeenCalled();
    mm.join({ userId: 'b', petId: '2' });
    expect(onMatch).toHaveBeenCalledWith({ userId: 'a', petId: '1' }, { userId: 'b', petId: '2' });
    expect(mm.size).toBe(0);
  });
  it('ignores duplicates and supports leave', () => {
    const mm = new Matchmaker(vi.fn());
    expect(mm.join({ userId: 'a' })).toBe(true);
    expect(mm.join({ userId: 'a' })).toBe(false);
    expect(mm.leave('a')).toBe(true);
    expect(mm.size).toBe(0);
  });
});

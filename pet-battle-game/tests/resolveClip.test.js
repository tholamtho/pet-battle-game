import { describe, it, expect } from 'vitest';
import { resolveStateClip, resolveSkillClip } from '@/render/animation/resolveClip.js';

describe('resolveStateClip', () => {
  it('finds clips by naming convention, ignoring case and exporter prefixes', () => {
    const names = ['Armature|Idle', 'ATTACK_1'.replace('_', ''), 'Get Hit', 'Die'];
    expect(resolveStateClip('idle', names)).toBe('Armature|Idle');
    expect(resolveStateClip('attack', names)).toBe('ATTACK1');
    expect(resolveStateClip('hit', names)).toBe('Get Hit');
    expect(resolveStateClip('faint', names)).toBe('Die');
    expect(resolveStateClip('special', names)).toBeNull();
  });
  it('explicit config wins over convention', () => {
    expect(resolveStateClip('attack', ['attack', 'Bite'], { animations: { attack: 'Bite' } })).toBe('Bite');
  });
  it('returns null (not a wrong clip) when the configured clip does not exist', () => {
    expect(resolveStateClip('attack', ['attack'], { animations: { attack: 'Nope' } })).toBeNull();
  });
});

describe('resolveSkillClip', () => {
  const names = ['idle', 'attack', 'special', 'Roar'];
  it('uses skill.anim to pick attack vs special', () => {
    expect(resolveSkillClip({ id: 'a', anim: 'attack' }, names)).toEqual({ clipName: 'attack', state: 'attack' });
    expect(resolveSkillClip({ id: 'b', anim: 'special' }, names)).toEqual({ clipName: 'special', state: 'special' });
  });
  it('special falls back to the attack clip when the pet has no special clip', () => {
    expect(resolveSkillClip({ id: 'b', anim: 'special' }, ['attack'])).toEqual({ clipName: 'attack', state: 'special' });
  });
  it('per-skill override: a clip name or a state name', () => {
    const cfg = { skillAnimations: { x: 'Roar', y: 'special' } };
    expect(resolveSkillClip({ id: 'x', anim: 'attack' }, names, cfg).clipName).toBe('Roar');
    expect(resolveSkillClip({ id: 'y', anim: 'attack' }, names, cfg)).toEqual({ clipName: 'special', state: 'special' });
  });
  it('no clips at all -> clipName null so the procedural fallback runs', () => {
    expect(resolveSkillClip({ id: 'a', anim: 'special' }, [])).toEqual({ clipName: null, state: 'special' });
  });
});

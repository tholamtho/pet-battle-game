import { CLIP_ALIASES, STATES } from './config.js';

// "Armature|Idle.001" -> "idle001"; keeps matching tolerant to what Blender/Mixamo exporters produce.
const norm = (s) => String(s).split('|').pop().toLowerCase().replace(/[^a-z0-9]/g, '');

function findClip(clipNames, wanted) {
  return clipNames.find((n) => n === wanted) ?? clipNames.find((n) => norm(n) === norm(wanted)) ?? null;
}

/** Which clip plays for a logical state (idle/attack/hit/special/faint)? Config first, then naming convention. */
export function resolveStateClip(state, clipNames, config = {}) {
  const explicit = config.animations?.[state];
  if (explicit) return findClip(clipNames, explicit);
  for (const alias of CLIP_ALIASES[state] ?? []) {
    const hit = clipNames.find((n) => norm(n) === alias);
    if (hit) return hit;
  }
  return null;
}

/**
 * Which clip plays when this pet uses this skill?
 *   1. config.skillAnimations[skill.id]  (a clip name, or "attack"/"special")
 *   2. skill.anim ("special" -> special clip, anything else -> attack clip)
 *   3. a special skill with no special clip falls back to the attack clip
 * `state` is the logical animation, used for timing and for the procedural fallback when no clip exists.
 */
export function resolveSkillClip(skill, clipNames, config = {}) {
  const override = config.skillAnimations?.[skill.id];
  if (override) {
    if (STATES.includes(override)) return { clipName: resolveStateClip(override, clipNames, config), state: override };
    return { clipName: findClip(clipNames, override), state: skill.anim === 'special' ? 'special' : 'attack' };
  }
  const state = skill.anim === 'special' ? 'special' : 'attack';
  const clipName = resolveStateClip(state, clipNames, config) ?? (state === 'special' ? resolveStateClip('attack', clipNames, config) : null);
  return { clipName, state };
}

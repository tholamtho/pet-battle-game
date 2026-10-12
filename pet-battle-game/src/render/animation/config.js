/** Logical animation states every pet can have. Artists only need to provide the clips they want. */
export const STATES = ['idle', 'attack', 'hit', 'special', 'faint'];

/** Clip names recognised automatically (case/punctuation-insensitive; "Armature|Idle" works too). */
export const CLIP_ALIASES = {
  idle: ['idle', 'stand', 'wait', 'breathe'],
  attack: ['attack', 'attack1', 'atk', 'strike'],
  hit: ['hit', 'hurt', 'damage', 'damaged', 'gethit', 'hitreact'],
  special: ['special', 'skill', 'attack2', 'cast', 'ultimate'],
  faint: ['faint', 'die', 'death', 'dead', 'ko'],
};

/** Defaults for public/pets/<speciesId>/config.json. Every field is optional. */
export const DEFAULT_CONFIG = {
  model: 'model.glb', // file inside the pet's folder
  scale: 1,
  rotationY: 0, // radians; use Math.PI if the model faces backwards
  yOffset: 0,
  animations: {}, // { idle: "ClipName", attack: "...", hit: "...", special: "...", faint: "..." }
  skillAnimations: {}, // { flame_burst: "ClipName" | "attack" | "special" }  per-skill override
  timing: {}, // seconds into the clip when the hit lands: { attackImpact, specialImpact }
  lunge: false, // true = also slide toward the target during clips (for clips without root motion)
  sockets: {}, // where equipment attaches: { head: { bone: "Head", offset: [0, 0.1, 0], rotation: [0, 0, 0], scale: 1 }, ... }
};

export const SLOTS = ['head', 'body', 'back', 'accessory'];

/** Used when a pet has no socket configured for a slot: positions relative to the pet's origin (feet). */
export const DEFAULT_SOCKETS = {
  head: { offset: [0, 1.95, 0.05] },
  body: { offset: [0, 1.05, 0] },
  back: { offset: [0, 1.15, -0.5] },
  accessory: { offset: [0.55, 0.95, 0.3] },
};

/** Defaults for public/items/<itemId>/config.json. */
export const DEFAULT_ITEM_CONFIG = { model: 'model.glb', scale: 1, offset: [0, 0, 0], rotation: [0, 0, 0] };

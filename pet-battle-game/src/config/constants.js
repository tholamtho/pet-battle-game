/** Sides as the SCENE and HUD see them: always "you" on the left, opponent on the right. */
export const SIDE = Object.freeze({ PLAYER: 'player', ENEMY: 'enemy' });

// Event types come from the engine so client and server can never disagree.
export { EVENT } from '@/engine/sides.js';

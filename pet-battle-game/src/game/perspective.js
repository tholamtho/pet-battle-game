import { SIDE } from '@/config/constants.js';
import { other } from '@/engine/index.js';

/** The engine speaks p1/p2. The scene and HUD speak player/enemy (you are always "player"). */
export const viewSide = (side, you) => (side === you ? SIDE.PLAYER : SIDE.ENEMY);

export function toViewEvent(event, you) {
  const e = { ...event };
  if (e.side) e.side = viewSide(e.side, you);
  if (e.targetSide) e.targetSide = viewSide(e.targetSide, you);
  if (e.winner) e.winner = viewSide(e.winner, you);
  return e;
}

export const viewCombatants = (state, you) => ({ player: state.sides[you], enemy: state.sides[other(you)] });

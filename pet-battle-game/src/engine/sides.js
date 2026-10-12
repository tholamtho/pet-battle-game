export const P1 = 'p1';
export const P2 = 'p2';
export const SIDES = Object.freeze([P1, P2]);
export const other = (side) => (side === P1 ? P2 : P1);

export const EVENT = Object.freeze({ ATTACK: 'attack', MISS: 'miss', FAINT: 'faint', END: 'end' });

export class BattleRuleError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'BattleRuleError';
    this.code = code;
  }
}

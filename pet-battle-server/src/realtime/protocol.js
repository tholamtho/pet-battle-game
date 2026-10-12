import { z } from 'zod';

/**
 * Client -> server messages. Server -> client messages:
 *   auth.ok {user}                       queue.joined / queue.left
 *   battle.start {battleId, you, state}  battle.resume {battleId, you, state, turn, submitted}
 *   battle.action.ack {battleId, turn}   battle.opponent_ready / opponent_disconnected {graceMs} / opponent_reconnected
 *   battle.turn {battleId, events, state}   (also carries the final KO events)
 *   battle.end {battleId, winner, reason}   (forfeit / disconnect only)
 *   error {code, message}                pong
 */
export const clientMessage = z.discriminatedUnion('type', [
  z.object({ type: z.literal('auth'), token: z.string().min(10) }),
  z.object({ type: z.literal('ping') }),
  z.object({ type: z.literal('queue.join'), petId: z.string().uuid().optional() }),
  z.object({ type: z.literal('queue.leave') }),
  z.object({ type: z.literal('battle.action'), battleId: z.string().uuid(), skillId: z.string().min(1).max(40) }),
  z.object({ type: z.literal('battle.forfeit'), battleId: z.string().uuid() }),
]);

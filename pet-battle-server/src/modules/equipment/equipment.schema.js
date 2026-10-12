import { z } from 'zod';

const params = z.object({ id: z.string().uuid(), slot: z.enum(['head', 'body', 'back', 'accessory']) });

export const equip = { params, body: z.object({ itemId: z.string().min(1).max(40) }) };
export const unequip = { params };

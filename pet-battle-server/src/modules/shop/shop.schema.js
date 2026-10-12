import { z } from 'zod';

export const buy = { body: z.object({ itemId: z.string().min(1).max(40), quantity: z.number().int().min(1).max(99).default(1) }) };

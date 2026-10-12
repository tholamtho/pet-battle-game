import { z } from 'zod';

const idParams = z.object({ id: z.string().uuid() });

export const startPve = { body: z.object({ petId: z.string().uuid().optional() }).default({}) };
export const getBattle = { params: idParams };
export const turn = { params: idParams, body: z.object({ skillId: z.string().min(1).max(40) }) };
export const forfeit = { params: idParams };

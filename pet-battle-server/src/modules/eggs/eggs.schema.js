import { z } from 'zod';

const idParams = z.object({ id: z.string().uuid() });
const itemId = z.string().min(1).max(40);

export const incubate = { body: z.object({ itemId }) };
export const speedup = { params: idParams, body: z.object({ itemId }) };
export const hatch = { params: idParams };

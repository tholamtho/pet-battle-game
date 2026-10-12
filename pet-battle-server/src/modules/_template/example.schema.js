import { z } from 'zod';

export const create = { body: z.object({ name: z.string().trim().min(1).max(40) }) };

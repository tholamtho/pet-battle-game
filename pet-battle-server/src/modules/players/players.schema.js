import { z } from 'zod';

export const chooseStarter = { body: z.object({ speciesId: z.string().min(1).max(40) }) };

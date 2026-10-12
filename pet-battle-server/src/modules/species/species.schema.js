import { z } from 'zod';

export const getSpecies = { params: z.object({ id: z.string().min(1).max(40) }) };

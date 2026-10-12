import { z } from 'zod';

const idParams = z.object({ id: z.string().min(1).max(40) });

export const getMap = { params: idParams };
export const enterMap = { params: idParams };
export const encounter = { params: idParams };

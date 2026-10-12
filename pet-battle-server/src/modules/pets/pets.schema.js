import { z } from 'zod';

const idParams = z.object({ id: z.string().uuid() });

export const getPet = { params: idParams };
export const releasePet = { params: idParams };
export const renamePet = {
  params: idParams,
  body: z.object({ nickname: z.string().trim().min(1).max(20).nullable() }),
};
export const setTeam = {
  body: z.object({
    petIds: z.array(z.string().uuid()).max(6).refine((a) => new Set(a).size === a.length, 'Duplicate pet ids'),
  }),
};
export const evolvePet = { params: idParams };

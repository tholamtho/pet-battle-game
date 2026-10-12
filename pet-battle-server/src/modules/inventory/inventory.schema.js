import { z } from 'zod';

export const useItem = {
  body: z.object({
    itemId: z.string().min(1).max(40),
    petId: z.string().uuid(),
    quantity: z.number().int().min(1).max(99).default(1),
  }),
};

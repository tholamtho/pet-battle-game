import { z } from 'zod';

const username = z.string().trim().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers and underscore only');

export const register = { body: z.object({ username, password: z.string().min(8).max(72) }) };
export const login = { body: z.object({ username: z.string().min(1).max(20), password: z.string().min(1).max(72) }) };

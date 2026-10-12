import rateLimit from 'express-rate-limit';

const base = { standardHeaders: true, legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } } };

export const apiLimiter = rateLimit({ ...base, windowMs: 60_000, limit: 300 });
export const authLimiter = rateLimit({ ...base, windowMs: 15 * 60_000, limit: 30 });

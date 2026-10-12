import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { unauthorized } from '../common/errors.js';

export function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return next(unauthorized());
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = { id: payload.sub, username: payload.username };
    next();
  } catch {
    next(unauthorized('Invalid or expired token'));
  }
}

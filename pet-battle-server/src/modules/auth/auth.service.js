import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { withTransaction } from '../../db/pool.js';
import { conflict, unauthorized } from '../../common/errors.js';
import * as playersService from '../players/players.service.js';
import * as repo from './auth.repo.js';

// Compared against when the user does not exist, so response time doesn't reveal valid usernames.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

const issueToken = (user) =>
  jwt.sign({ username: user.username }, env.JWT_SECRET, { subject: user.id, expiresIn: env.JWT_EXPIRES_IN });

export async function register({ username, password }) {
  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const user = await withTransaction(async (db) => {
      const created = await repo.create({ username, passwordHash }, db);
      await playersService.createProfile(created.id, db);
      return created;
    });
    return { token: issueToken(user), user: { id: user.id, username: user.username } };
  } catch (err) {
    if (err.code === '23505') throw conflict('Username already taken');
    throw err;
  }
}

export async function login({ username, password }) {
  const user = await repo.findByUsername(username);
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw unauthorized('Wrong username or password');
  return { token: issueToken(user), user: { id: user.id, username: user.username } };
}

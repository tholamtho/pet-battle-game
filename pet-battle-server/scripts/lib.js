import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

export async function withClient(fn) {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export async function sqlFiles(dirName) {
  const dir = path.join(root, dirName);
  const names = (await fs.readdir(dir)).filter((n) => n.endsWith('.sql')).sort();
  return Promise.all(names.map(async (name) => ({ name, sql: await fs.readFile(path.join(dir, name), 'utf8') })));
}

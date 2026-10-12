// Minimal forward-only migration runner: applies migrations/*.sql in name order, once each.
import { withClient, sqlFiles } from './lib.js';

await withClient(async (db) => {
  await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
  const { rows } = await db.query('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.name));

  let count = 0;
  for (const { name, sql } of await sqlFiles('migrations')) {
    if (applied.has(name)) continue;
    try {
      await db.query('BEGIN');
      await db.query(sql);
      await db.query('INSERT INTO schema_migrations(name) VALUES ($1)', [name]);
      await db.query('COMMIT');
      console.log(`applied ${name}`);
      count++;
    } catch (err) {
      await db.query('ROLLBACK');
      console.error(`failed ${name}: ${err.message}`);
      process.exit(1);
    }
  }
  console.log(count ? `${count} migration(s) applied` : 'database is up to date');
});

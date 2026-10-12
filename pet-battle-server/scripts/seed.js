// Runs seeds/*.sql. Every seed is idempotent (upserts), so it is safe to run repeatedly.
import { withClient, sqlFiles } from './lib.js';

await withClient(async (db) => {
  for (const { name, sql } of await sqlFiles('seeds')) {
    try {
      await db.query('BEGIN');
      await db.query(sql);
      await db.query('COMMIT');
      console.log(`seeded ${name}`);
    } catch (err) {
      await db.query('ROLLBACK');
      console.error(`failed ${name}: ${err.message}`);
      process.exit(1);
    }
  }
});

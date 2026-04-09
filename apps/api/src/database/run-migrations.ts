import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

  const client = url
    ? new Client({
        connectionString: url,
        ssl:
          url.includes('sslmode=require') || url.includes('neon.tech') || url.includes('amazonaws.com')
            ? { rejectUnauthorized: false }
            : undefined,
      })
    : new Client({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        database: process.env.POSTGRES_DB || 'sse_dev',
        user: process.env.POSTGRES_USER || 'sse_user',
        password: process.env.POSTGRES_PASSWORD || 'sse_password_dev',
      });

  await client.connect();
  console.log('[migrations] connected to database');

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        filename    TEXT PRIMARY KEY,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationsDir = path.resolve(__dirname, 'migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    const { rows } = await client.query<{ filename: string }>(
      'SELECT filename FROM public.schema_migrations',
    );
    const applied = new Set(rows.map((r) => r.filename));

    let appliedCount = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`[migrations] skip   ${file}`);
        continue;
      }
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`[migrations] apply  ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO public.schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        appliedCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[migrations] FAILED ${file}`);
        throw err;
      }
    }

    console.log(`[migrations] done — ${appliedCount} applied, ${applied.size} already present`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[migrations] fatal:', err);
  process.exit(1);
});

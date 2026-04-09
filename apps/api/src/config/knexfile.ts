import type { Knex } from 'knex';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

function connectionConfig(): Knex.StaticConnectionConfig | Knex.ConnectionConfigProvider | string {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (url) return url;

  return {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'sse_dev',
    user: process.env.POSTGRES_USER || 'sse_user',
    password: process.env.POSTGRES_PASSWORD || 'sse_password_dev',
  };
}

const config: Knex.Config = {
  client: 'pg',
  connection: connectionConfig(),
  migrations: {
    directory: '../database/migrations',
    extension: 'ts',
  },
  seeds: {
    directory: '../database/seeds',
    extension: 'ts',
  },
};

export default config;

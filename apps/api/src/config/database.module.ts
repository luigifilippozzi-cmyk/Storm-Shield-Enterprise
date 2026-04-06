import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import knex, { Knex } from 'knex';
import { TenantDatabaseService } from './tenant-database.service';

export const KNEX_CONNECTION = 'KNEX_CONNECTION';
export const KNEX_ADMIN_CONNECTION = 'KNEX_ADMIN_CONNECTION';

/**
 * Determine if SSL should be used for a given connection URL.
 */
function needsSsl(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes('neon.tech') || url.includes('amazonaws.com') || url.includes('sslmode=require');
}

/**
 * Build a Knex config for a URL-based or discrete-var connection.
 */
function buildKnexConfig(
  configService: ConfigService,
  urlEnvKey: string,
  fallbackUrlKey: string | null,
  fallbackUser: string,
  fallbackUserDefault: string,
  fallbackPassword: string,
  fallbackPasswordDefault: string,
  pool: { min: number; max: number },
): Knex.Config {
  const url = configService.get<string>(urlEnvKey)
    || (fallbackUrlKey ? configService.get<string>(fallbackUrlKey) : undefined);

  if (url) {
    const ssl = needsSsl(url) ? { rejectUnauthorized: false } : undefined;
    return {
      client: 'pg',
      connection: ssl
        ? { connectionString: url, ssl }
        : { connectionString: url },
      pool,
    };
  }

  return {
    client: 'pg',
    connection: {
      host: configService.get('POSTGRES_HOST', 'localhost'),
      port: configService.get('POSTGRES_PORT', 5432),
      database: configService.get('POSTGRES_DB', 'sse_dev'),
      user: configService.get(fallbackUser, fallbackUserDefault),
      password: configService.get(fallbackPassword, fallbackPasswordDefault),
    },
    pool,
  };
}

@Global()
@Module({
  providers: [
    {
      // Runtime connection — uses sse_app user, subject to RLS policies
      provide: KNEX_CONNECTION,
      useFactory: (configService: ConfigService): Knex => {
        return knex(
          buildKnexConfig(
            configService,
            'DATABASE_URL',
            null,
            'POSTGRES_APP_USER',
            'sse_app',
            'POSTGRES_APP_PASSWORD',
            'sse_app_password_dev',
            { min: 2, max: 20 },
          ),
        );
      },
      inject: [ConfigService],
    },
    {
      // Admin connection — uses superuser, bypasses RLS (migrations, provisioning)
      provide: KNEX_ADMIN_CONNECTION,
      useFactory: (configService: ConfigService): Knex => {
        return knex(
          buildKnexConfig(
            configService,
            'DATABASE_URL_UNPOOLED',
            'DATABASE_URL',
            'POSTGRES_USER',
            'sse_user',
            'POSTGRES_PASSWORD',
            'sse_password_dev',
            { min: 1, max: 5 },
          ),
        );
      },
      inject: [ConfigService],
    },
    TenantDatabaseService,
  ],
  exports: [KNEX_CONNECTION, KNEX_ADMIN_CONNECTION, TenantDatabaseService],
})
export class DatabaseModule {}

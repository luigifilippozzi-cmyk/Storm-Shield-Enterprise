import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import knex, { Knex } from 'knex';
import { TenantDatabaseService } from './tenant-database.service';

export const KNEX_CONNECTION = 'KNEX_CONNECTION';
export const KNEX_ADMIN_CONNECTION = 'KNEX_ADMIN_CONNECTION';

@Global()
@Module({
  providers: [
    {
      // Runtime connection — uses sse_app user, subject to RLS policies
      provide: KNEX_CONNECTION,
      useFactory: (configService: ConfigService): Knex => {
        return knex({
          client: 'pg',
          connection: {
            host: configService.get('POSTGRES_HOST', 'localhost'),
            port: configService.get('POSTGRES_PORT', 5432),
            database: configService.get('POSTGRES_DB', 'sse_dev'),
            user: configService.get('POSTGRES_APP_USER', 'sse_app'),
            password: configService.get('POSTGRES_APP_PASSWORD', 'sse_app_password_dev'),
          },
          pool: { min: 2, max: 20 },
        });
      },
      inject: [ConfigService],
    },
    {
      // Admin connection — uses superuser, bypasses RLS (migrations, provisioning)
      provide: KNEX_ADMIN_CONNECTION,
      useFactory: (configService: ConfigService): Knex => {
        return knex({
          client: 'pg',
          connection: {
            host: configService.get('POSTGRES_HOST', 'localhost'),
            port: configService.get('POSTGRES_PORT', 5432),
            database: configService.get('POSTGRES_DB', 'sse_dev'),
            user: configService.get('POSTGRES_USER', 'sse_user'),
            password: configService.get('POSTGRES_PASSWORD', 'sse_password_dev'),
          },
          pool: { min: 1, max: 5 },
        });
      },
      inject: [ConfigService],
    },
    TenantDatabaseService,
  ],
  exports: [KNEX_CONNECTION, KNEX_ADMIN_CONNECTION, TenantDatabaseService],
})
export class DatabaseModule {}

import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import knex, { Knex } from 'knex';

export const KNEX_CONNECTION = 'KNEX_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: KNEX_CONNECTION,
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
          pool: { min: 2, max: 20 },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [KNEX_CONNECTION],
})
export class DatabaseModule {}

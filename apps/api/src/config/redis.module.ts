import { Module, Global, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (config: ConfigService): Redis => {
        const url = config.get<string>('REDIS_URL');
        const client = url
          ? new Redis(url, { lazyConnect: false, maxRetriesPerRequest: 3 })
          : new Redis({
              host: config.get<string>('REDIS_HOST', 'localhost'),
              port: config.get<number>('REDIS_PORT', 6379),
              password: config.get<string>('REDIS_PASSWORD', 'sse_redis_dev'),
              lazyConnect: false,
              maxRetriesPerRequest: 3,
            });
        // Prevent unhandled 'error' events from crashing the process when
        // Redis is temporarily unreachable. /ready reports degraded status.
        client.on('error', () => undefined);
        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}

export const InjectRedis = () => Inject(REDIS_CLIENT);

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
        if (url) {
          return new Redis(url, {
            lazyConnect: false,
            maxRetriesPerRequest: 3,
          });
        }
        return new Redis({
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD', 'sse_redis_dev'),
          lazyConnect: false,
          maxRetriesPerRequest: 3,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}

export const InjectRedis = () => Inject(REDIS_CLIENT);

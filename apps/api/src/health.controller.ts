import { Controller, Get, Inject, HttpCode, HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { Knex } from 'knex';
import Redis from 'ioredis';
import { KNEX_CONNECTION } from './config/database.module';
import { REDIS_CLIENT } from './config/redis.module';

@Controller()
export class HealthController {
  constructor(
    @Inject(KNEX_CONNECTION) private readonly db: Knex,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * Lightweight liveness probe — always returns 200 if the process is running.
   * Used by container orchestrators to decide whether to restart the process.
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /**
   * Readiness probe — checks DB and Redis connectivity.
   * Returns 200 when all dependencies are reachable, 503 otherwise.
   * Used by load balancers to decide whether to route traffic to this instance.
   */
  @Get('ready')
  @HttpCode(HttpStatus.OK)
  async readiness() {
    const checks: Record<string, 'up' | 'down'> = { db: 'down', redis: 'down' };

    // Database check
    try {
      await this.db.raw('SELECT 1');
      checks.db = 'up';
    } catch {
      /* keep down */
    }

    // Redis check
    try {
      await this.redis.ping();
      checks.redis = 'up';
    } catch {
      /* keep down */
    }

    const allUp = Object.values(checks).every((v) => v === 'up');

    if (!allUp) {
      throw new ServiceUnavailableException({
        status: 'unavailable',
        checks,
        timestamp: new Date().toISOString(),
      });
    }

    return { status: 'ok', checks, timestamp: new Date().toISOString() };
  }
}

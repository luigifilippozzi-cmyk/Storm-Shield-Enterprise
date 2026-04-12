import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';

const { combine, timestamp, json, errors, colorize, simple } = winston.format;

const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';

const winstonInstance = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'ISO' }),
    json(),
  ),
  defaultMeta: { service: 'sse-api' },
  transports: [
    new winston.transports.Console({
      format: isProduction
        ? combine(timestamp({ format: 'ISO' }), json())
        : combine(colorize(), simple()),
    }),
  ],
  // Catch uncaught exceptions and unhandled rejections
  exceptionHandlers: [
    new winston.transports.Console({
      format: combine(timestamp({ format: 'ISO' }), json()),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: combine(timestamp({ format: 'ISO' }), json()),
    }),
  ],
  exitOnError: false,
});

/**
 * NestJS-compatible logger backed by Winston.
 * Drop-in replacement for the default ConsoleLogger.
 */
export class WinstonLogger implements LoggerService {
  log(message: any, context?: string) {
    winstonInstance.info(message, { context });
  }

  error(message: any, trace?: string, context?: string) {
    winstonInstance.error(message, { trace, context });
  }

  warn(message: any, context?: string) {
    winstonInstance.warn(message, { context });
  }

  debug(message: any, context?: string) {
    winstonInstance.debug(message, { context });
  }

  verbose(message: any, context?: string) {
    winstonInstance.verbose(message, { context });
  }
}

export { winstonInstance };

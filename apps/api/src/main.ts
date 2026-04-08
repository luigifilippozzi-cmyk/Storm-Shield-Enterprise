import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { WinstonLogger } from './common/logger/winston.logger';

async function bootstrap() {
  const logger = new WinstonLogger();
  const app = await NestFactory.create(AppModule, { logger });
  const config = app.get(ConfigService);

  app.use(helmet());

  app.enableCors({
    origin: config.get<string>('CORS_ORIGINS', 'http://localhost:3000').split(','),
    credentials: true,
  });

  const prefix = config.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(prefix, { exclude: ['health', 'ready'] });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Storm Shield Enterprise API')
    .setDescription('ERP SaaS for auto repair businesses')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.get<number>('API_PORT', 3001);
  await app.listen(port);
  logger.log(`SSE API running on port ${port}`, 'Bootstrap');
}

bootstrap();

import { Global, Module } from '@nestjs/common';
import { ActivationEventsService } from './activation.service';
import { ActivationController } from './activation.controller';

@Global()
@Module({
  providers: [ActivationEventsService],
  controllers: [ActivationController],
  exports: [ActivationEventsService],
})
export class ActivationModule {}

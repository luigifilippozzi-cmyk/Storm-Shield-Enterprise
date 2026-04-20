import { Module } from '@nestjs/common';
import { ActivationModule } from './activation/activation.module';

@Module({
  imports: [ActivationModule],
  exports: [ActivationModule],
})
export class AdminModule {}

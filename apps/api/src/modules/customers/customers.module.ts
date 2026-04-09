import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { ConsentController } from './consent/consent.controller';
import { ConsentService } from './consent/consent.service';

@Module({
  controllers: [CustomersController, ConsentController],
  providers: [CustomersService, ConsentService],
  exports: [CustomersService],
})
export class CustomersModule {}

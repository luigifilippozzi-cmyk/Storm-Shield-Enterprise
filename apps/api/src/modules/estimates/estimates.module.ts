import { Module } from '@nestjs/common';
import { EstimatesController } from './estimates.controller';
import { EstimatesService } from './estimates.service';
import { EstimateStateMachineService } from './estimate-state-machine.service';
import { SlaNotificationService } from './sla-notification.service';

@Module({
  controllers: [EstimatesController],
  providers: [EstimatesService, EstimateStateMachineService, SlaNotificationService],
  exports: [EstimatesService, EstimateStateMachineService],
})
export class EstimatesModule {}

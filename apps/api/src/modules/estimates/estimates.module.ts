import { Module } from '@nestjs/common';
import { EstimatesController } from './estimates.controller';
import { EstimatesService } from './estimates.service';
import { EstimateStateMachineService } from './estimate-state-machine.service';

@Module({
  controllers: [EstimatesController],
  providers: [EstimatesService, EstimateStateMachineService],
  exports: [EstimatesService, EstimateStateMachineService],
})
export class EstimatesModule {}

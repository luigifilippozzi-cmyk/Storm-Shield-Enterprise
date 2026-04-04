import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateServiceOrderDto } from './create-service-order.dto';

export class UpdateServiceOrderDto extends PartialType(
  OmitType(CreateServiceOrderDto, ['order_number', 'estimate_id'] as const),
) {}

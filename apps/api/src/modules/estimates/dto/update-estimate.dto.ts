import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateEstimateDto } from './create-estimate.dto';

export class UpdateEstimateDto extends PartialType(
  OmitType(CreateEstimateDto, ['estimate_number', 'estimated_by'] as const),
) {}

import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstimateStatus } from '@sse/shared-types';

export class UpdateEstimateStatusDto {
  @ApiProperty({ enum: EstimateStatus })
  @IsEnum(EstimateStatus)
  status!: EstimateStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

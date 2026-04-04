import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstimateStatusDto } from './create-estimate.dto';

export class UpdateEstimateStatusDto {
  @ApiProperty({ enum: EstimateStatusDto })
  @IsEnum(EstimateStatusDto)
  status!: EstimateStatusDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

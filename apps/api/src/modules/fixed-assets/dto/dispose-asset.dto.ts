import {
  IsUUID, IsEnum, IsDateString, IsString, IsOptional, IsNumber, Min, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DisposalType } from '@sse/shared-types';

export class DisposeAssetDto {
  @ApiProperty({ enum: DisposalType })
  @IsEnum(DisposalType)
  disposal_type!: DisposalType;

  @ApiProperty({ example: '2024-06-30', description: 'Disposal date (ISO 8601)' })
  @IsDateString()
  disposal_date!: string;

  @ApiPropertyOptional({ example: 5000.00, description: 'Sale proceeds (default 0)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  disposal_proceeds?: number;

  @ApiProperty({ description: 'UUID of the fiscal period for the disposal JE' })
  @IsUUID()
  fiscal_period_id!: string;

  @ApiProperty({ example: 'End of useful life, upgrading to newer model' })
  @IsString()
  @MaxLength(500)
  reason!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  buyer_info?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

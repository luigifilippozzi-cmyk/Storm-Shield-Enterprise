import { IsUUID, IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExecuteDepreciationDto {
  @ApiProperty({ description: 'UUID of the fixed asset' })
  @IsUUID()
  fixed_asset_id!: string;

  @ApiProperty({ description: 'UUID of the fiscal period' })
  @IsUUID()
  fiscal_period_id!: string;

  @ApiProperty({ example: '2024-03-31', description: 'Entry date (ISO 8601)' })
  @IsDateString()
  entry_date!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BatchDepreciationDto {
  @ApiProperty({ description: 'UUID of the fiscal period' })
  @IsUUID()
  fiscal_period_id!: string;

  @ApiProperty({ example: '2024-03-31', description: 'Entry date (ISO 8601)' })
  @IsDateString()
  entry_date!: string;
}

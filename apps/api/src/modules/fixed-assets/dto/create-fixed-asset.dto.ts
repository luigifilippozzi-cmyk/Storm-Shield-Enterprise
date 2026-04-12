import {
  IsString, IsOptional, IsUUID, IsEnum, IsInt, IsNumber, IsDateString,
  MaxLength, MinLength, Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DepreciationMethod } from '@sse/shared-types';

export class CreateFixedAssetDto {
  @ApiProperty({ description: 'Asset category UUID' })
  @IsUUID()
  category_id!: string;

  @ApiProperty({ example: 'EQ-001', description: 'Unique asset tag (up to 20 chars)' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  asset_tag!: string;

  @ApiProperty({ example: 'CNC Plasma Cutter' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  asset_name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'SN-2024-XYZ' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serial_number?: string;

  @ApiProperty({ example: '2024-01-15', description: 'Acquisition date (ISO 8601)' })
  @IsDateString()
  acquisition_date!: string;

  @ApiProperty({ example: 25000.00, description: 'Acquisition cost (> 0)' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  acquisition_cost!: number;

  @ApiPropertyOptional({ example: 2500.00, description: 'Salvage value (default 0)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salvage_value?: number;

  @ApiPropertyOptional({ example: 'Bay 3, Main Shop' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ description: 'UUID of responsible user' })
  @IsOptional()
  @IsUUID()
  responsible_user_id?: string;

  @ApiProperty({ enum: DepreciationMethod })
  @IsEnum(DepreciationMethod)
  depreciation_method!: DepreciationMethod;

  @ApiProperty({ example: 84, description: 'Useful life in months' })
  @IsInt()
  @Min(1)
  useful_life_months!: number;

  @ApiProperty({ example: '2024-02-01', description: 'Depreciation start date (ISO 8601)' })
  @IsDateString()
  depreciation_start_date!: string;
}

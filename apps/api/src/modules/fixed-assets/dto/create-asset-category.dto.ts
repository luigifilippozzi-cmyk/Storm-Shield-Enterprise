import {
  IsString, IsOptional, IsUUID, IsBoolean, IsEnum, IsInt, IsNumber,
  MaxLength, MinLength, Min, Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DepreciationMethod } from '@sse/shared-types';

export class CreateAssetCategoryDto {
  @ApiProperty({ example: 'Machinery & Equipment' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  category_name!: string;

  @ApiPropertyOptional({ example: 'Heavy machinery and shop equipment' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'GL account for the asset value' })
  @IsUUID()
  asset_account_id!: string;

  @ApiProperty({ description: 'GL account for accumulated depreciation' })
  @IsUUID()
  depreciation_account_id!: string;

  @ApiProperty({ description: 'GL account for depreciation expense' })
  @IsUUID()
  expense_account_id!: string;

  @ApiProperty({ description: 'GL account for gain/loss on disposal' })
  @IsUUID()
  gain_loss_account_id!: string;

  @ApiPropertyOptional({ enum: DepreciationMethod, default: DepreciationMethod.STRAIGHT_LINE })
  @IsOptional()
  @IsEnum(DepreciationMethod)
  default_depreciation_method?: DepreciationMethod;

  @ApiPropertyOptional({ example: 84, description: 'Default useful life in months' })
  @IsOptional()
  @IsInt()
  @Min(1)
  default_useful_life_months?: number;

  @ApiPropertyOptional({ example: 5.00, description: 'Default salvage value percentage (0-99.99)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99.99)
  default_salvage_pct?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

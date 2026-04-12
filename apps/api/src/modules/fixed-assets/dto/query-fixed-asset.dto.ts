import { IsOptional, IsString, IsEnum, IsInt, IsUUID, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AssetStatus, DepreciationMethod } from '@sse/shared-types';

export class QueryFixedAssetDto {
  @ApiPropertyOptional({ description: 'Search by asset_tag, asset_name, or serial_number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: AssetStatus })
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({ enum: DepreciationMethod })
  @IsOptional()
  @IsEnum(DepreciationMethod)
  depreciation_method?: DepreciationMethod;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @ApiPropertyOptional({ default: 'asset_tag' })
  @IsOptional()
  @IsString()
  sort_by?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sort_order?: 'asc' | 'desc';
}

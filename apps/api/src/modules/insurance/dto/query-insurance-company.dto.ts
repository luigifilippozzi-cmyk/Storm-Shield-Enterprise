import { IsOptional, IsString, IsBoolean, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryInsuranceCompanyDto {
  @ApiPropertyOptional({ description: 'Search by name, code, or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by DRP status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_drp?: boolean;

  @ApiPropertyOptional({ default: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    enum: ['name', 'code', 'payment_terms_days', 'created_at', 'updated_at'],
    default: 'created_at',
    description: 'Sort field',
  })
  @IsOptional()
  @IsString()
  sort_by?: string = 'created_at';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc', description: 'Sort order' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sort_order?: 'asc' | 'desc' = 'desc';
}

import { IsOptional, IsString, IsEnum, IsInt, IsISO8601, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TransactionType } from '@sse/shared-types';

export class QueryTransactionDto {
  @ApiPropertyOptional({ description: 'Search by description or reference number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType)
  transaction_type?: TransactionType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter from date (ISO 8601)', example: '2024-01-01' })
  @IsOptional()
  @IsISO8601({ strict: true })
  date_from?: string;

  @ApiPropertyOptional({ description: 'Filter to date (ISO 8601)', example: '2024-12-31' })
  @IsOptional()
  @IsISO8601({ strict: true })
  date_to?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ default: 'created_at' })
  @IsOptional()
  @IsString()
  sort_by?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sort_order?: 'asc' | 'desc';
}

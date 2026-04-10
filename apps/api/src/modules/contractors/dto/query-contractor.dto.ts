import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContractorStatus } from '@sse/shared-types';

export class QueryContractorDto {
  @ApiPropertyOptional({ description: 'Search by name, company, email, or phone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ContractorStatus })
  @IsOptional()
  @IsEnum(ContractorStatus)
  status?: ContractorStatus;

  @ApiPropertyOptional({ description: 'Filter by specialty' })
  @IsOptional()
  @IsString()
  specialty?: string;

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

  @ApiPropertyOptional({ default: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum({ asc: 'asc', desc: 'desc' })
  sort_order?: 'asc' | 'desc';
}

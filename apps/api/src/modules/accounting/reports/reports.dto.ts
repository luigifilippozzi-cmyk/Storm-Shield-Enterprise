import { IsOptional, IsDateString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class TrialBalanceQueryDto {
  @ApiPropertyOptional({ description: 'Filter by fiscal period ID' })
  @IsOptional()
  @IsUUID()
  fiscal_period_id?: string;

  @ApiPropertyOptional({ description: 'As-of date (inclusive)' })
  @IsOptional()
  @IsDateString()
  as_of_date?: string;
}

export class ProfitLossQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  fiscal_period_id?: string;
}

export class BalanceSheetQueryDto {
  @ApiPropertyOptional({ description: 'As-of date for balance sheet (defaults to today)' })
  @IsOptional()
  @IsDateString()
  as_of_date?: string;
}

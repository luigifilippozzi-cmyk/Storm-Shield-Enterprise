import {
  IsString, IsOptional, IsUUID, IsISO8601, IsArray,
  ValidateNested, IsNumber, Min, MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateJournalEntryLineDto {
  @ApiProperty({ description: 'Chart of accounts ID' })
  @IsUUID()
  account_id!: string;

  @ApiProperty({ example: 150.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  debit!: number;

  @ApiProperty({ example: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  credit!: number;

  @ApiPropertyOptional({ example: 'Payment for invoice #123' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateJournalEntryDto {
  @ApiProperty({ example: '2026-01-15' })
  @IsISO8601({ strict: true })
  entry_date!: string;

  @ApiProperty({ example: 'Monthly depreciation entry' })
  @IsString()
  @MaxLength(500)
  description!: string;

  @ApiPropertyOptional({ example: 'depreciation' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  reference_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  reference_id?: string;

  @ApiProperty({ type: [CreateJournalEntryLineDto], minItems: 2 })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateJournalEntryLineDto)
  lines!: CreateJournalEntryLineDto[];
}

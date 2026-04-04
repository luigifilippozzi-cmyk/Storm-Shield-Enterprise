import {
  IsString, IsOptional, IsEnum, IsUUID, IsNumber, IsBoolean, IsInt,
  IsDateString, IsArray, ValidateNested, MaxLength, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EstimateStatusDto {
  DRAFT = 'draft',
  SENT = 'sent',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUPPLEMENT_REQUESTED = 'supplement_requested',
  CONVERTED = 'converted',
}

export enum EstimateLineTypeDto {
  LABOR = 'labor',
  PARTS = 'parts',
  PAINT = 'paint',
  SUBLET = 'sublet',
  OTHER = 'other',
}

export class CreateEstimateLineDto {
  @ApiProperty({ enum: EstimateLineTypeDto })
  @IsEnum(EstimateLineTypeDto)
  line_type!: EstimateLineTypeDto;

  @ApiProperty({ example: 'Remove and replace front bumper' })
  @IsString()
  @MaxLength(500)
  description!: string;

  @ApiProperty({ example: 1.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  quantity!: number;

  @ApiProperty({ example: 250.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unit_price!: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_taxable?: boolean = true;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number = 0;
}

export class CreateEstimateDto {
  @ApiProperty({ example: 'EST-2024-001' })
  @IsString()
  @MaxLength(50)
  estimate_number!: string;

  @ApiProperty()
  @IsUUID()
  customer_id!: string;

  @ApiProperty()
  @IsUUID()
  vehicle_id!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  insurance_company_id?: string;

  @ApiPropertyOptional({ example: 'CLM-2024-001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  claim_number?: string;

  @ApiPropertyOptional({ example: 500.00 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  deductible?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'User who created the estimate' })
  @IsUUID()
  estimated_by!: string;

  @ApiPropertyOptional({ example: '2024-02-15' })
  @IsOptional()
  @IsDateString()
  valid_until?: string;

  @ApiPropertyOptional({ type: [CreateEstimateLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEstimateLineDto)
  lines?: CreateEstimateLineDto[];
}

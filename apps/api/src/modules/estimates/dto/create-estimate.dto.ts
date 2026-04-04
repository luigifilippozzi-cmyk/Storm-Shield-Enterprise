import { IsString, IsUUID, IsOptional, IsEnum, IsNumber, IsBoolean, IsInt, IsArray, ValidateNested, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

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
  MATERIALS = 'materials',
  SUBLET = 'sublet',
  OTHER = 'other',
}

export class CreateEstimateLineDto {
  @ApiProperty({ enum: EstimateLineTypeDto })
  @IsEnum(EstimateLineTypeDto)
  line_type!: EstimateLineTypeDto;

  @ApiProperty({ example: 'Front bumper repair' })
  @IsString()
  @MaxLength(500)
  description!: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiProperty({ example: 150.00 })
  @IsNumber()
  @Min(0)
  unit_price!: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_taxable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
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

  @ApiPropertyOptional({ example: 'CLM-123456' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  claim_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  deductible?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty()
  @IsUUID()
  estimated_by!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  valid_until?: string;

  @ApiPropertyOptional({ type: [CreateEstimateLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEstimateLineDto)
  lines?: CreateEstimateLineDto[];
}

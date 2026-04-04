import { IsString, IsOptional, IsEnum, IsUUID, IsInt, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum VehicleConditionDto {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

export class CreateVehicleDto {
  @ApiProperty({ description: 'Customer who owns the vehicle' })
  @IsUUID()
  customer_id!: string;

  @ApiProperty({ example: 2024, minimum: 1900, maximum: 2100 })
  @IsInt()
  @Min(1900)
  @Max(2100)
  year!: number;

  @ApiProperty({ example: 'Toyota' })
  @IsString()
  @MaxLength(100)
  make!: string;

  @ApiProperty({ example: 'Camry' })
  @IsString()
  @MaxLength(100)
  model!: string;

  @ApiPropertyOptional({ example: 'SE' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  trim?: string;

  @ApiPropertyOptional({ example: 'Silver' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiPropertyOptional({ example: '1HGBH41JXMN109186' })
  @IsOptional()
  @IsString()
  @MaxLength(17)
  vin?: string;

  @ApiPropertyOptional({ example: 45000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  mileage?: number;

  @ApiPropertyOptional({ enum: VehicleConditionDto })
  @IsOptional()
  @IsEnum(VehicleConditionDto)
  condition?: VehicleConditionDto;

  @ApiPropertyOptional({ example: 'ABC-1234' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  license_plate?: string;

  @ApiPropertyOptional({ example: 'MO' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  license_state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  insurance_company_id?: string;

  @ApiPropertyOptional({ example: 'CLM-2024-001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  claim_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

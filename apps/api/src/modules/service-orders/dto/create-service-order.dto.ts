import { IsString, IsUUID, IsOptional, IsEnum, IsISO8601, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceOrderStatus } from '@sse/shared-types';

export class CreateServiceOrderDto {
  @ApiProperty({ example: 'SO-2024-001' })
  @IsString()
  @MaxLength(50)
  order_number!: string;

  @ApiProperty()
  @IsUUID()
  estimate_id!: string;

  @ApiProperty()
  @IsUUID()
  customer_id!: string;

  @ApiProperty()
  @IsUUID()
  vehicle_id!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigned_to?: string;

  @ApiPropertyOptional({ example: '2024-02-15' })
  @IsOptional()
  @IsISO8601({ strict: true })
  estimated_completion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

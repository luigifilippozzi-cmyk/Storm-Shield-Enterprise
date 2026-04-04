import { IsString, IsUUID, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ServiceOrderStatusDto {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  WAITING_PARTS = 'waiting_parts',
  WAITING_APPROVAL = 'waiting_approval',
  COMPLETED = 'completed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

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
  @IsString()
  estimated_completion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

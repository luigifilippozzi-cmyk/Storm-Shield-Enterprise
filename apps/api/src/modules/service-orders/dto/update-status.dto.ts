import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceOrderStatus } from '@sse/shared-types';

export class UpdateServiceOrderStatusDto {
  @ApiProperty({ enum: ServiceOrderStatus })
  @IsEnum(ServiceOrderStatus)
  status!: ServiceOrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

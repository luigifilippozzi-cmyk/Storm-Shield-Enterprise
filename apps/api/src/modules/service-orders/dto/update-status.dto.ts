import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceOrderStatusDto } from './create-service-order.dto';

export class UpdateServiceOrderStatusDto {
  @ApiProperty({ enum: ServiceOrderStatusDto })
  @IsEnum(ServiceOrderStatusDto)
  status!: ServiceOrderStatusDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

import { IsString, IsOptional, IsEnum, IsNumber, IsUUID, IsDateString, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@sse/shared-types';

export class CreateContractorPaymentDto {
  @ApiProperty({ description: 'Contractor ID' })
  @IsUUID()
  contractor_id!: string;

  @ApiPropertyOptional({ description: 'Related service order ID' })
  @IsOptional()
  @IsUUID()
  service_order_id?: string;

  @ApiProperty({ example: 500.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  payment_method!: PaymentMethod;

  @ApiPropertyOptional({ example: 'CHK-12345' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference_number?: string;

  @ApiPropertyOptional({ example: 'Payment for hail damage repair - VIN 1234' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: '2026-04-10' })
  @IsDateString()
  payment_date!: string;
}

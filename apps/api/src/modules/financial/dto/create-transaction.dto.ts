import { IsString, IsUUID, IsOptional, IsEnum, IsNumber, IsISO8601, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType, PaymentMethod } from '@sse/shared-types';

export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  transaction_type!: TransactionType;

  @ApiProperty({ example: 'Parts & Materials' })
  @IsString()
  @MaxLength(100)
  category!: string;

  @ApiProperty({ example: 'Front bumper replacement parts' })
  @IsString()
  @MaxLength(500)
  description!: string;

  @ApiProperty({ example: 1500.00 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  payment_method!: PaymentMethod;

  @ApiProperty({ example: '2024-01-15' })
  @IsISO8601({ strict: true })
  transaction_date!: string;

  @ApiProperty()
  @IsUUID()
  created_by!: string;

  @ApiPropertyOptional({ example: 'REF-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  service_order_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  contractor_id?: string;
}

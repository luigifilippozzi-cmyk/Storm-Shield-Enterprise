import { IsString, IsOptional, IsEnum, IsUUID, IsNumber, IsDateString, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TransactionTypeDto {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

export enum PaymentMethodDto {
  CASH = 'cash',
  CHECK = 'check',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  ACH = 'ach',
  WIRE = 'wire',
  INSURANCE_PAYMENT = 'insurance_payment',
}

export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionTypeDto })
  @IsEnum(TransactionTypeDto)
  transaction_type!: TransactionTypeDto;

  @ApiProperty({ example: 'pdr_repair' })
  @IsString()
  @MaxLength(100)
  category!: string;

  @ApiProperty({ example: 'PDR repair for 2024 Toyota Camry' })
  @IsString()
  @MaxLength(500)
  description!: string;

  @ApiProperty({ example: 1500.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiProperty({ enum: PaymentMethodDto })
  @IsEnum(PaymentMethodDto)
  payment_method!: PaymentMethodDto;

  @ApiPropertyOptional({ example: 'INV-2024-001' })
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

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  transaction_date!: string;

  @ApiProperty({ description: 'User who created the transaction' })
  @IsUUID()
  created_by!: string;
}

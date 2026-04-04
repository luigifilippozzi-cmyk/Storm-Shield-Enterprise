import { IsString, IsUUID, IsOptional, IsEnum, IsNumber, MaxLength, Min } from 'class-validator';
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

  @ApiProperty({ enum: PaymentMethodDto })
  @IsEnum(PaymentMethodDto)
  payment_method!: PaymentMethodDto;

  @ApiProperty({ example: '2024-01-15' })
  @IsString()
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

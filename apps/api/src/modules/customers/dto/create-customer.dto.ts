import { IsString, IsEmail, IsOptional, IsEnum, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CustomerTypeDto {
  INDIVIDUAL = 'individual',
  BUSINESS = 'business',
}

export enum CustomerSourceDto {
  INSURANCE = 'insurance',
  WALK_IN = 'walk_in',
  REFERRAL = 'referral',
  WEBSITE = 'website',
  OTHER = 'other',
}

export class CreateCustomerDto {
  @ApiProperty({ enum: CustomerTypeDto, default: CustomerTypeDto.INDIVIDUAL })
  @IsEnum(CustomerTypeDto)
  type: CustomerTypeDto = CustomerTypeDto.INDIVIDUAL;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  first_name!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  last_name!: string;

  @ApiPropertyOptional({ example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  company_name?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+15551234567' })
  @IsString()
  @MinLength(7)
  @MaxLength(30)
  phone!: string;

  @ApiPropertyOptional({ example: '+15559876543' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone_secondary?: string;

  @ApiPropertyOptional({ example: '123 Main St' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Springfield' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'MO' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string;

  @ApiPropertyOptional({ example: '65801' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  zip?: string;

  @ApiProperty({ enum: CustomerSourceDto, default: CustomerSourceDto.WALK_IN })
  @IsEnum(CustomerSourceDto)
  source: CustomerSourceDto = CustomerSourceDto.WALK_IN;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  insurance_company_id?: string;

  @ApiPropertyOptional({ example: 'POL-123456' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  policy_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

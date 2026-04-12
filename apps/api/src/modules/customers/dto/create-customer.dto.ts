import { IsString, IsEmail, IsOptional, IsEnum, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerType, CustomerSource } from '@sse/shared-types';

export class CreateCustomerDto {
  @ApiProperty({ enum: CustomerType, default: CustomerType.INDIVIDUAL })
  @IsEnum(CustomerType)
  type: CustomerType = CustomerType.INDIVIDUAL;

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

  @ApiProperty({ enum: CustomerSource, default: CustomerSource.WALK_IN })
  @IsEnum(CustomerSource)
  source: CustomerSource = CustomerSource.WALK_IN;

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

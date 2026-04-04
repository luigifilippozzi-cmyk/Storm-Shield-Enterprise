import { IsString, IsOptional, IsEmail, IsInt, IsBoolean, MinLength, MaxLength, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInsuranceCompanyDto {
  @ApiProperty({ description: 'Company name', example: 'State Farm Insurance', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Company code/abbreviation', example: 'SF', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({ description: 'Is this a Direct Repair Program (DRP) partner', example: true })
  @IsOptional()
  @IsBoolean()
  is_drp?: boolean;

  @ApiPropertyOptional({ description: 'Standard payment terms in days', example: 30, minimum: 0, maximum: 365 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  payment_terms_days?: number;

  @ApiPropertyOptional({ description: 'Phone number', example: '(573) 555-0100', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'claims@statefarm.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ description: 'Physical address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'City', example: 'Jefferson City', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'State abbreviation', example: 'MO', maxLength: 2 })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  state?: string;

  @ApiPropertyOptional({ description: 'ZIP/Postal code', example: '65101', maxLength: 10 })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  zip?: string;

  @ApiPropertyOptional({ description: 'Internal notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

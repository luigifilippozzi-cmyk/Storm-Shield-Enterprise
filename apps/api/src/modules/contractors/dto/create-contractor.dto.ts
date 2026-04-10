import { IsString, IsEmail, IsOptional, IsEnum, IsBoolean, IsNumber, MaxLength, MinLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContractorStatus } from '@sse/shared-types';

export class CreateContractorDto {
  @ApiProperty({ example: 'Mike' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  first_name!: string;

  @ApiProperty({ example: 'Johnson' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  last_name!: string;

  @ApiPropertyOptional({ example: 'Johnson PDR Services' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  company_name?: string;

  @ApiPropertyOptional({ example: 'mike@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+15551234567' })
  @IsString()
  @MinLength(7)
  @MaxLength(30)
  phone!: string;

  @ApiPropertyOptional({ example: '12-3456789', description: 'Employer Identification Number' })
  @IsOptional()
  @IsString()
  @MaxLength(12)
  ein?: string;

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

  @ApiPropertyOptional({ example: 'PDR' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  specialty?: string;

  @ApiPropertyOptional({ example: 75.00 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  hourly_rate?: number;

  @ApiPropertyOptional({ enum: ContractorStatus, default: ContractorStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ContractorStatus)
  status?: ContractorStatus;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  w9_on_file?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

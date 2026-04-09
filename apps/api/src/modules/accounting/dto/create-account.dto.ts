import {
  IsString, IsOptional, IsEnum, IsUUID, IsBoolean,
  MaxLength, MinLength, Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType, NormalBalance } from '@sse/shared-types';

export class CreateAccountDto {
  @ApiProperty({ example: '1010', description: '4-digit account number (1000-9999)' })
  @IsString()
  @MinLength(4)
  @MaxLength(10)
  @Matches(/^\d{4,10}$/, { message: 'account_number must be numeric (4-10 digits)' })
  account_number!: string;

  @ApiProperty({ example: 'Cash / Checking' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ example: 'Primary operating checking account' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: AccountType })
  @IsEnum(AccountType)
  account_type!: AccountType;

  @ApiProperty({ enum: NormalBalance })
  @IsEnum(NormalBalance)
  normal_balance!: NormalBalance;

  @ApiPropertyOptional({ description: 'UUID of the parent account' })
  @IsOptional()
  @IsUUID()
  parent_id?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

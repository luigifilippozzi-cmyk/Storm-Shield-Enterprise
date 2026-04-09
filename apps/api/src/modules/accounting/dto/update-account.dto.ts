import { IsString, IsOptional, IsEnum, IsUUID, IsBoolean, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType, NormalBalance } from '@sse/shared-types';

export class UpdateAccountDto {
  @ApiPropertyOptional({ example: 'Cash / Checking' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'Primary operating checking account' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: AccountType })
  @IsOptional()
  @IsEnum(AccountType)
  account_type?: AccountType;

  @ApiPropertyOptional({ enum: NormalBalance })
  @IsOptional()
  @IsEnum(NormalBalance)
  normal_balance?: NormalBalance;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parent_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

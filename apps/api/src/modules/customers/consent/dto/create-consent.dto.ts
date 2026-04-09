import { IsNotEmpty, IsString, IsOptional, IsIn, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConsentDto {
  @ApiProperty({ enum: ['marketing_email', 'sms_notification', 'data_processing', 'data_sharing'] })
  @IsNotEmpty()
  @IsIn(['marketing_email', 'sms_notification', 'data_processing', 'data_sharing'])
  consent_type!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  granted_at?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  consent_text?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  version?: string;
}

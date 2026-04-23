import { IsString, IsEnum, IsOptional, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CaseType {
  COMPLAINT = 'complaint',
  QUALITY_ISSUE = 'quality_issue',
  REFUND_REQUEST = 'refund_request',
  GENERAL_INQUIRY = 'general_inquiry',
  OTHER = 'other',
}

export enum CasePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export class CreateCaseDto {
  @ApiProperty({ enum: CaseType })
  @IsEnum(CaseType)
  case_type!: CaseType;

  @ApiProperty({ maxLength: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @ApiProperty({ maxLength: 10000 })
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  body!: string;

  @ApiPropertyOptional({ enum: CasePriority, default: CasePriority.MEDIUM })
  @IsOptional()
  @IsEnum(CasePriority)
  priority?: CasePriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vehicle_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  related_estimate_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  related_so_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigned_to_user_id?: string;
}

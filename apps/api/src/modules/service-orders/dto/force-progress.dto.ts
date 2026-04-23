import { IsEnum, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const ALLOWED_TARGET_STATUSES = [
  'in_progress',
  'waiting_parts',
  'waiting_approval',
  'completed',
  'cancelled',
] as const;

type ForceProgressStatus = (typeof ALLOWED_TARGET_STATUSES)[number];

export class ForceProgressDto {
  @ApiProperty({
    description: 'Reason for overriding the dispute lock (required for audit trail)',
    minLength: 10,
  })
  @IsString()
  @MinLength(10)
  reason!: string;

  @ApiProperty({
    description: 'Target status for the service order',
    enum: ALLOWED_TARGET_STATUSES,
  })
  @IsEnum(ALLOWED_TARGET_STATUSES, { message: `target_status must be one of: ${ALLOWED_TARGET_STATUSES.join(', ')}` })
  target_status!: ForceProgressStatus;
}

import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DisputeResolutionTarget {
  AWAITING_APPROVAL = 'awaiting_approval',
  PAID = 'paid',
  CLOSED = 'closed',
}

export class ResolveDisputeDto {
  @ApiProperty({
    enum: DisputeResolutionTarget,
    description: 'Target status to transition to when resolving the dispute',
  })
  @IsEnum(DisputeResolutionTarget)
  resolution_status!: DisputeResolutionTarget;

  @ApiPropertyOptional({ description: 'Notes about the resolution', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

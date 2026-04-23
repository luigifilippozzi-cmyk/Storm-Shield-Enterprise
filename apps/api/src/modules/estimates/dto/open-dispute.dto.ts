import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DisputeReason {
  ADJUSTER_UNDERPAYMENT = 'adjuster_underpayment',
  SUPPLEMENT_REJECTED = 'supplement_rejected',
  CLAIM_DENIED = 'claim_denied',
  TOTAL_LOSS_DISPUTE = 'total_loss_dispute',
  OTHER = 'other',
}

export class OpenDisputeDto {
  @ApiProperty({ enum: DisputeReason, description: 'Reason for the dispute' })
  @IsEnum(DisputeReason)
  dispute_reason!: DisputeReason;

  @ApiPropertyOptional({ description: 'Additional notes about the dispute', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  dispute_notes?: string;
}

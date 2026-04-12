import { IsString, IsISO8601, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFiscalPeriodDto {
  @ApiProperty({ example: 'January 2026' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: '2026-01-01' })
  @IsISO8601({ strict: true })
  start_date!: string;

  @ApiProperty({ example: '2026-01-31' })
  @IsISO8601({ strict: true })
  end_date!: string;
}

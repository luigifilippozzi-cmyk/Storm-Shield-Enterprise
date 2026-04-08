import { IsString, IsNumber, Min, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSupplementDto {
  @ApiProperty({ example: 'Additional hail damage found on roof panel' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;

  @ApiProperty({ example: 350.00 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;
}

import { IsOptional, IsString, MaxLength, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UploadPhotoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({ enum: ['general', 'damage', 'before', 'after', 'detail'] })
  @IsOptional()
  @IsIn(['general', 'damage', 'before', 'after', 'detail'])
  photo_type?: string;
}

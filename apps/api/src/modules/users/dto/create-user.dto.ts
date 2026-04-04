import { IsString, IsEmail, IsOptional, IsEnum, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserStatusDto {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  INVITED = 'invited',
}

export class CreateUserDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  first_name!: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  last_name!: string;

  @ApiPropertyOptional({ example: '+15551234567' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({ description: 'Clerk external auth ID' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  external_auth_id?: string;

  @ApiPropertyOptional({ enum: UserStatusDto, default: UserStatusDto.INVITED })
  @IsOptional()
  @IsEnum(UserStatusDto)
  status?: UserStatusDto = UserStatusDto.INVITED;
}

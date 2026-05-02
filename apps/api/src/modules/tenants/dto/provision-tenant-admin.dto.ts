import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProvisionTenantAdminDto {
  @ApiProperty({ description: 'Email address of the new admin/owner user' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'First name' })
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ description: 'Last name' })
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({ enum: ['owner', 'admin'], description: 'Role to assign' })
  @IsIn(['owner', 'admin'])
  role!: 'owner' | 'admin';

  @ApiPropertyOptional({ description: 'Clerk user ID (external_auth_id) if user already exists in Clerk' })
  @IsOptional()
  @IsString()
  @Matches(/^user_[a-zA-Z0-9]+$/, { message: 'externalAuthId must be a valid Clerk user ID (user_...)' })
  externalAuthId?: string;
}

import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
}

export class CreateNotificationDto {
  @ApiProperty({ description: 'Target user ID' })
  @IsUUID()
  user_id!: string;

  @ApiPropertyOptional({ enum: NotificationType, default: NotificationType.INFO })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ enum: NotificationChannel, default: NotificationChannel.IN_APP })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiProperty({ maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({ description: 'Additional structured data (JSON)' })
  @IsOptional()
  data?: Record<string, unknown>;
}

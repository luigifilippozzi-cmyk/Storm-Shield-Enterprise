import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { PlanGuard, RequirePlanFeature } from '../../common/guards/plan.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard, TenantGuard, RbacGuard, PlanGuard)
@RequirePlanFeature('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for the current user' })
  @ApiResponse({ status: 200, description: 'Paginated notification list' })
  @RequirePermissions('notifications:read:list')
  findAll(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Query() query: QueryNotificationDto,
  ) {
    return this.notificationsService.findAll(tenantId, userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get count of unread notifications' })
  @ApiResponse({ status: 200, description: 'Unread count' })
  @RequirePermissions('notifications:read:list')
  countUnread(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.countUnread(tenantId, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a notification (admin/owner only)' })
  @ApiResponse({ status: 201, description: 'Notification created' })
  @RequirePermissions('notifications:write:create')
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notificationsService.create(tenantId, dto);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @RequirePermissions('notifications:write:update')
  markAllRead(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notificationsService.markAllRead(tenantId, userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @RequirePermissions('notifications:write:update')
  markRead(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationsService.markRead(tenantId, userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  @RequirePermissions('notifications:write:delete')
  remove(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notificationsService.remove(tenantId, userId, id);
  }
}

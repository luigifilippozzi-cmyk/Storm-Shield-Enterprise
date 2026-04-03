import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard, TenantGuard, RbacGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('users:read:list')
  findAll(@CurrentTenant() tenantId: string, @Query() query: any) {
    return this.usersService.findAll(tenantId, query);
  }

  @Post()
  @RequirePermissions('users:write:create')
  create(@CurrentTenant() tenantId: string, @Body() body: any) {
    return this.usersService.create(tenantId, body);
  }

  @Get(':id')
  @RequirePermissions('users:read:detail')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.usersService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequirePermissions('users:write:update')
  update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.usersService.update(tenantId, id, body);
  }

  @Delete(':id')
  @RequirePermissions('users:write:delete')
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.usersService.remove(tenantId, id);
  }
}

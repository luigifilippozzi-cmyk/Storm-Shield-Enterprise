import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ServiceOrdersService } from './service-orders.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('service-orders')
@ApiBearerAuth()
@UseGuards(AuthGuard, TenantGuard, RbacGuard)
@Controller('service-orders')
export class ServiceOrdersController {
  constructor(private readonly serviceOrdersService: ServiceOrdersService) {}

  @Get()
  @RequirePermissions('service-orders:read:list')
  findAll(@CurrentTenant() tenantId: string, @Query() query: any) {
    return this.serviceOrdersService.findAll(tenantId, query);
  }

  @Post()
  @RequirePermissions('service-orders:write:create')
  create(@CurrentTenant() tenantId: string, @Body() body: any) {
    return this.serviceOrdersService.create(tenantId, body);
  }

  @Get(':id')
  @RequirePermissions('service-orders:read:detail')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.serviceOrdersService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequirePermissions('service-orders:write:update')
  update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.serviceOrdersService.update(tenantId, id, body);
  }

  @Patch(':id/status')
  @RequirePermissions('service-orders:write:update')
  updateStatus(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.serviceOrdersService.updateStatus(tenantId, id, body.status);
  }

  @Delete(':id')
  @RequirePermissions('service-orders:write:delete')
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.serviceOrdersService.remove(tenantId, id);
  }
}

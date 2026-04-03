import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('vehicles')
@ApiBearerAuth()
@UseGuards(AuthGuard, TenantGuard, RbacGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @RequirePermissions('vehicles:read:list')
  findAll(@CurrentTenant() tenantId: string, @Query() query: any) {
    return this.vehiclesService.findAll(tenantId, query);
  }

  @Post()
  @RequirePermissions('vehicles:write:create')
  create(@CurrentTenant() tenantId: string, @Body() body: any) {
    return this.vehiclesService.create(tenantId, body);
  }

  @Get(':id')
  @RequirePermissions('vehicles:read:detail')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.vehiclesService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequirePermissions('vehicles:write:update')
  update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.vehiclesService.update(tenantId, id, body);
  }

  @Delete(':id')
  @RequirePermissions('vehicles:write:delete')
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.vehiclesService.remove(tenantId, id);
  }
}

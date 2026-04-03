import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EstimatesService } from './estimates.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('estimates')
@ApiBearerAuth()
@UseGuards(AuthGuard, TenantGuard, RbacGuard)
@Controller('estimates')
export class EstimatesController {
  constructor(private readonly estimatesService: EstimatesService) {}

  @Get()
  @RequirePermissions('estimates:read:list')
  findAll(@CurrentTenant() tenantId: string, @Query() query: any) {
    return this.estimatesService.findAll(tenantId, query);
  }

  @Post()
  @RequirePermissions('estimates:write:create')
  create(@CurrentTenant() tenantId: string, @Body() body: any) {
    return this.estimatesService.create(tenantId, body);
  }

  @Get(':id')
  @RequirePermissions('estimates:read:detail')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.estimatesService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequirePermissions('estimates:write:update')
  update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.estimatesService.update(tenantId, id, body);
  }

  @Patch(':id/status')
  @RequirePermissions('estimates:write:update')
  updateStatus(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.estimatesService.updateStatus(tenantId, id, body.status);
  }

  @Delete(':id')
  @RequirePermissions('estimates:write:delete')
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.estimatesService.remove(tenantId, id);
  }
}

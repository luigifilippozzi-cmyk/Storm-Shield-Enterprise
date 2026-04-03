import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InsuranceService } from './insurance.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('insurance')
@ApiBearerAuth()
@UseGuards(AuthGuard, TenantGuard, RbacGuard)
@Controller('insurance')
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  @Get()
  @RequirePermissions('insurance:read:list')
  findAll(@CurrentTenant() tenantId: string, @Query() query: any) {
    return this.insuranceService.findAll(tenantId, query);
  }

  @Post()
  @RequirePermissions('insurance:write:create')
  create(@CurrentTenant() tenantId: string, @Body() body: any) {
    return this.insuranceService.create(tenantId, body);
  }

  @Get(':id')
  @RequirePermissions('insurance:read:detail')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.insuranceService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequirePermissions('insurance:write:update')
  update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.insuranceService.update(tenantId, id, body);
  }

  @Delete(':id')
  @RequirePermissions('insurance:write:delete')
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.insuranceService.remove(tenantId, id);
  }
}

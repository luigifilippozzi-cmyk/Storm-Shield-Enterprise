import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FinancialService } from './financial.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('financial')
@ApiBearerAuth()
@UseGuards(AuthGuard, TenantGuard, RbacGuard)
@Controller('financial')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Get('summary')
  @RequirePermissions('financial:read:list')
  getSummary(@CurrentTenant() tenantId: string, @Query() query: any) {
    return this.financialService.getSummary(tenantId, query);
  }

  @Get()
  @RequirePermissions('financial:read:list')
  findAll(@CurrentTenant() tenantId: string, @Query() query: any) {
    return this.financialService.findAll(tenantId, query);
  }

  @Post()
  @RequirePermissions('financial:write:create')
  create(@CurrentTenant() tenantId: string, @Body() body: any) {
    return this.financialService.create(tenantId, body);
  }

  @Get(':id')
  @RequirePermissions('financial:read:detail')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.financialService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequirePermissions('financial:write:update')
  update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.financialService.update(tenantId, id, body);
  }

  @Delete(':id')
  @RequirePermissions('financial:write:delete')
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.financialService.remove(tenantId, id);
  }
}

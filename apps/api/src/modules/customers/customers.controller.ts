import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(AuthGuard, TenantGuard, RbacGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermissions('customers:read:list')
  findAll(@CurrentTenant() tenantId: string, @Query() query: any) {
    return this.customersService.findAll(tenantId, query);
  }

  @Post()
  @RequirePermissions('customers:write:create')
  create(@CurrentTenant() tenantId: string, @Body() body: any) {
    return this.customersService.create(tenantId, body);
  }

  @Get(':id')
  @RequirePermissions('customers:read:detail')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.customersService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequirePermissions('customers:write:update')
  update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.customersService.update(tenantId, id, body);
  }

  @Delete(':id')
  @RequirePermissions('customers:write:delete')
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.customersService.remove(tenantId, id);
  }
}

import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServiceOrdersService } from './service-orders.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { QueryServiceOrderDto } from './dto/query-service-order.dto';
import { UpdateServiceOrderStatusDto } from './dto/update-status.dto';
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
  @ApiOperation({ summary: 'List service orders with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated service order list' })
  @RequirePermissions('service-orders:read:list')
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryServiceOrderDto) {
    return this.serviceOrdersService.findAll(tenantId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new service order' })
  @ApiResponse({ status: 201, description: 'Service order created' })
  @RequirePermissions('service-orders:write:create')
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateServiceOrderDto) {
    return this.serviceOrdersService.create(tenantId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service order by ID' })
  @ApiResponse({ status: 200, description: 'Service order found' })
  @ApiResponse({ status: 404, description: 'Service order not found' })
  @RequirePermissions('service-orders:read:detail')
  findOne(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.serviceOrdersService.findOne(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update service order' })
  @ApiResponse({ status: 200, description: 'Service order updated' })
  @RequirePermissions('service-orders:write:update')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceOrderDto,
  ) {
    return this.serviceOrdersService.update(tenantId, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update service order status with workflow validation' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @RequirePermissions('service-orders:write:update')
  updateStatus(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceOrderStatusDto,
  ) {
    return this.serviceOrdersService.updateStatus(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete service order (pending/cancelled only)' })
  @ApiResponse({ status: 200, description: 'Service order deleted' })
  @RequirePermissions('service-orders:write:delete')
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.serviceOrdersService.remove(tenantId, id);
  }
}

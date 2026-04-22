import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards, ParseUUIDPipe, ParseIntPipe, Optional,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
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
  @ApiOperation({ summary: 'List customers with pagination and search' })
  @ApiResponse({ status: 200, description: 'Paginated customer list' })
  @RequirePermissions('customers:read:list')
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryCustomerDto) {
    return this.customersService.findAll(tenantId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created' })
  @RequirePermissions('customers:write:create')
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(tenantId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer found' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @RequirePermissions('customers:read:detail')
  findOne(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.customersService.findOne(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update customer' })
  @ApiResponse({ status: 200, description: 'Customer updated' })
  @RequirePermissions('customers:write:update')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete customer' })
  @ApiResponse({ status: 200, description: 'Customer deleted' })
  @RequirePermissions('customers:write:delete')
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.customersService.remove(tenantId, id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get Customer 360 summary metrics' })
  @ApiResponse({ status: 200, description: 'Open counts, balance, YTD revenue, last activity' })
  @RequirePermissions('customers:read:detail')
  getSummary(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.customersService.getSummary(tenantId, id);
  }

  @Get(':id/activity-timeline')
  @ApiOperation({ summary: 'Get customer activity timeline (merged events)' })
  @ApiResponse({ status: 200, description: 'Events sorted by occurred_at DESC' })
  @RequirePermissions('customers:read:detail')
  getActivityTimeline(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.customersService.getActivityTimeline(tenantId, id, parsedLimit);
  }
}

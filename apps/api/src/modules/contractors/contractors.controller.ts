import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ContractorsService } from './contractors.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';
import { QueryContractorDto } from './dto/query-contractor.dto';
import { CreateContractorPaymentDto } from './dto/create-payment.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('contractors')
@ApiBearerAuth()
@UseGuards(AuthGuard, TenantGuard, RbacGuard)
@Controller('contractors')
export class ContractorsController {
  constructor(private readonly contractorsService: ContractorsService) {}

  @Get()
  @ApiOperation({ summary: 'List contractors with pagination and search' })
  @ApiResponse({ status: 200, description: 'Paginated contractor list' })
  @RequirePermissions('contractors:read:list')
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryContractorDto) {
    return this.contractorsService.findAll(tenantId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new contractor' })
  @ApiResponse({ status: 201, description: 'Contractor created' })
  @RequirePermissions('contractors:write:create')
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateContractorDto) {
    return this.contractorsService.create(tenantId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contractor by ID with payment history' })
  @ApiResponse({ status: 200, description: 'Contractor found' })
  @ApiResponse({ status: 404, description: 'Contractor not found' })
  @RequirePermissions('contractors:read:detail')
  findOne(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contractorsService.findOne(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update contractor' })
  @ApiResponse({ status: 200, description: 'Contractor updated' })
  @RequirePermissions('contractors:write:update')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContractorDto,
  ) {
    return this.contractorsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete contractor' })
  @ApiResponse({ status: 200, description: 'Contractor deleted' })
  @RequirePermissions('contractors:write:delete')
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contractorsService.remove(tenantId, id);
  }

  // ── Payments ──

  @Get(':id/payments')
  @ApiOperation({ summary: 'List payments for a contractor' })
  @ApiResponse({ status: 200, description: 'Payment list' })
  @RequirePermissions('contractors:read:detail')
  getPayments(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contractorsService.getPayments(tenantId, id);
  }

  @Post('payments')
  @ApiOperation({ summary: 'Create a contractor payment' })
  @ApiResponse({ status: 201, description: 'Payment created' })
  @RequirePermissions('contractors:write:create')
  createPayment(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateContractorPaymentDto,
  ) {
    return this.contractorsService.createPayment(tenantId, userId, dto);
  }

  @Get(':id/ytd')
  @ApiOperation({ summary: 'Get year-to-date payment total for 1099 tracking' })
  @ApiResponse({ status: 200, description: 'YTD payment summary' })
  @RequirePermissions('contractors:read:detail')
  getYtdPayments(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('year') year?: number,
  ) {
    return this.contractorsService.getYtdPayments(tenantId, id, year);
  }
}

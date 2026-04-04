import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FinancialService } from './financial.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
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
  @ApiOperation({ summary: 'Get financial summary (totals)' })
  @ApiResponse({ status: 200, description: 'Financial summary' })
  @RequirePermissions('financial:read:list')
  getSummary(@CurrentTenant() tenantId: string) {
    return this.financialService.getSummary(tenantId);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get financial dashboard with trends and breakdowns' })
  @ApiResponse({ status: 200, description: 'Financial dashboard data' })
  @RequirePermissions('financial:read:list')
  getDashboard(@CurrentTenant() tenantId: string) {
    return this.financialService.getDashboard(tenantId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List transactions with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated transaction list' })
  @RequirePermissions('financial:read:list')
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryTransactionDto) {
    return this.financialService.findAll(tenantId, query);
  }

  @Post('transactions')
  @ApiOperation({ summary: 'Create a new financial transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  @RequirePermissions('financial:write:create')
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateTransactionDto) {
    return this.financialService.create(tenantId, dto);
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({ status: 200, description: 'Transaction found' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @RequirePermissions('financial:read:detail')
  findOne(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.financialService.findOne(tenantId, id);
  }

  @Put('transactions/:id')
  @ApiOperation({ summary: 'Update transaction' })
  @ApiResponse({ status: 200, description: 'Transaction updated' })
  @RequirePermissions('financial:write:update')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.financialService.update(tenantId, id, dto);
  }

  @Delete('transactions/:id')
  @ApiOperation({ summary: 'Soft delete transaction' })
  @ApiResponse({ status: 200, description: 'Transaction deleted' })
  @RequirePermissions('financial:write:delete')
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.financialService.remove(tenantId, id);
  }
}

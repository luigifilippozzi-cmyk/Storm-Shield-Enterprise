import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountQueryDto } from './dto/account-query.dto';
import { ReportsService } from './reports/reports.service';
import { TrialBalanceQueryDto, ProfitLossQueryDto, BalanceSheetQueryDto } from './reports/reports.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { PlanGuard, RequirePlanFeature } from '../../common/guards/plan.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('accounting')
@ApiBearerAuth()
@UseGuards(AuthGuard, TenantGuard, RbacGuard, PlanGuard)
@Controller('accounting')
export class AccountingController {
  constructor(
    private readonly accountingService: AccountingService,
    private readonly reportsService: ReportsService,
  ) {}

  @Get('accounts')
  @ApiOperation({ summary: 'List chart of accounts with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated account list' })
  @RequirePermissions('accounting:read:list')
  @RequirePlanFeature('accounting')
  findAll(@CurrentTenant() tenantId: string, @Query() query: AccountQueryDto) {
    return this.accountingService.findAll(tenantId, query);
  }

  @Get('accounts/tree')
  @ApiOperation({ summary: 'Get hierarchical chart of accounts tree' })
  @ApiResponse({ status: 200, description: 'Account tree structure' })
  @RequirePermissions('accounting:read:list')
  @RequirePlanFeature('accounting')
  getTree(@CurrentTenant() tenantId: string) {
    return this.accountingService.getTree(tenantId);
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Create a new account in the chart of accounts' })
  @ApiResponse({ status: 201, description: 'Account created' })
  @ApiResponse({ status: 409, description: 'Duplicate account number' })
  @RequirePermissions('accounting:write:create')
  @RequirePlanFeature('accounting')
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateAccountDto) {
    return this.accountingService.create(tenantId, dto);
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Get account by ID' })
  @ApiResponse({ status: 200, description: 'Account found' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @RequirePermissions('accounting:read:detail')
  @RequirePlanFeature('accounting')
  findOne(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.accountingService.findOne(tenantId, id);
  }

  @Put('accounts/:id')
  @ApiOperation({ summary: 'Update account (non-system accounts only)' })
  @ApiResponse({ status: 200, description: 'Account updated' })
  @ApiResponse({ status: 400, description: 'System account cannot be modified' })
  @RequirePermissions('accounting:write:update')
  @RequirePlanFeature('accounting')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountingService.update(tenantId, id, dto);
  }

  @Delete('accounts/:id')
  @ApiOperation({ summary: 'Soft delete account (non-system, no children)' })
  @ApiResponse({ status: 200, description: 'Account deleted' })
  @ApiResponse({ status: 400, description: 'System account or has children' })
  @RequirePermissions('accounting:write:delete')
  @RequirePlanFeature('accounting')
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.accountingService.remove(tenantId, id);
  }

  // ── Reports ──────────────────────────────────────────────────────────────

  @Get('reports/trial-balance')
  @ApiOperation({ summary: 'Trial Balance — all accounts with debit/credit totals and net balance' })
  @ApiResponse({ status: 200, description: 'Trial balance report' })
  @RequirePermissions('accounting:read:list')
  @RequirePlanFeature('accounting')
  getTrialBalance(
    @CurrentTenant() tenantId: string,
    @Query() query: TrialBalanceQueryDto,
  ) {
    return this.reportsService.getTrialBalance(tenantId, query);
  }

  @Get('reports/profit-loss')
  @ApiOperation({ summary: 'Profit & Loss — revenue vs expenses for a date range' })
  @ApiResponse({ status: 200, description: 'P&L report' })
  @RequirePermissions('accounting:read:list')
  @RequirePlanFeature('accounting')
  getProfitLoss(
    @CurrentTenant() tenantId: string,
    @Query() query: ProfitLossQueryDto,
  ) {
    return this.reportsService.getProfitLoss(tenantId, query);
  }

  @Get('reports/balance-sheet')
  @ApiOperation({ summary: 'Balance Sheet — assets, liabilities, equity as of a date' })
  @ApiResponse({ status: 200, description: 'Balance sheet report' })
  @RequirePermissions('accounting:read:list')
  @RequirePlanFeature('accounting')
  getBalanceSheet(
    @CurrentTenant() tenantId: string,
    @Query() query: BalanceSheetQueryDto,
  ) {
    return this.reportsService.getBalanceSheet(tenantId, query);
  }
}

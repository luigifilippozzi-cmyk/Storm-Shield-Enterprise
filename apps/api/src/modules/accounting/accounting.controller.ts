import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountQueryDto } from './dto/account-query.dto';
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
  constructor(private readonly accountingService: AccountingService) {}

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
}

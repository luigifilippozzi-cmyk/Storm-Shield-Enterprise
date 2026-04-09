import {
  Controller, Get, Post, Param, Query,
  UseGuards, ParseUUIDPipe, Body,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FiscalPeriodsService } from './fiscal-periods.service';
import { CreateFiscalPeriodDto } from './dto/create-fiscal-period.dto';
import { QueryFiscalPeriodDto } from './dto/query-fiscal-period.dto';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { PlanGuard, RequirePlanFeature } from '../../../common/guards/plan.guard';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@ApiTags('accounting / fiscal-periods')
@ApiBearerAuth()
@UseGuards(AuthGuard, TenantGuard, RbacGuard, PlanGuard)
@Controller('accounting/fiscal-periods')
export class FiscalPeriodsController {
  constructor(private readonly fiscalPeriodsService: FiscalPeriodsService) {}

  @Get()
  @ApiOperation({ summary: 'List fiscal periods' })
  @ApiResponse({ status: 200 })
  @RequirePermissions('accounting:read:list')
  @RequirePlanFeature('accounting')
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryFiscalPeriodDto) {
    return this.fiscalPeriodsService.findAll(tenantId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new fiscal period' })
  @ApiResponse({ status: 201 })
  @RequirePermissions('accounting:write:create')
  @RequirePlanFeature('accounting')
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateFiscalPeriodDto) {
    return this.fiscalPeriodsService.create(tenantId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fiscal period by ID' })
  @ApiResponse({ status: 200 })
  @RequirePermissions('accounting:read:detail')
  @RequirePlanFeature('accounting')
  findOne(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.fiscalPeriodsService.findOne(tenantId, id);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close a fiscal period (no draft entries allowed)' })
  @ApiResponse({ status: 200 })
  @RequirePermissions('accounting:write:update')
  @RequirePlanFeature('accounting')
  close(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.fiscalPeriodsService.close(tenantId, id, userId);
  }

  @Post(':id/reopen')
  @ApiOperation({ summary: 'Reopen a closed fiscal period (locked periods cannot be reopened)' })
  @ApiResponse({ status: 200 })
  @RequirePermissions('accounting:write:update')
  @RequirePlanFeature('accounting')
  reopen(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.fiscalPeriodsService.reopen(tenantId, id);
  }
}

import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FixedAssetsService } from './fixed-assets.service';
import { AssetCategoriesService } from './asset-categories.service';
import { DepreciationService } from './depreciation.service';
import { DisposalService } from './disposal.service';
import { CreateFixedAssetDto } from './dto/create-fixed-asset.dto';
import { UpdateFixedAssetDto } from './dto/update-fixed-asset.dto';
import { QueryFixedAssetDto } from './dto/query-fixed-asset.dto';
import { CreateAssetCategoryDto } from './dto/create-asset-category.dto';
import { ExecuteDepreciationDto, BatchDepreciationDto } from './dto/execute-depreciation.dto';
import { DisposeAssetDto } from './dto/dispose-asset.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { PlanGuard, RequirePlanFeature } from '../../common/guards/plan.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('fixed-assets')
@ApiBearerAuth()
@UseGuards(AuthGuard, TenantGuard, RbacGuard, PlanGuard)
@Controller('fixed-assets')
export class FixedAssetsController {
  constructor(
    private readonly fixedAssetsService: FixedAssetsService,
    private readonly categoriesService: AssetCategoriesService,
    private readonly depreciationService: DepreciationService,
    private readonly disposalService: DisposalService,
  ) {}

  // ── Asset Categories ──────────────────────────────────────────

  @Get('categories')
  @ApiOperation({ summary: 'List asset categories' })
  @RequirePermissions('accounting:read:list')
  @RequirePlanFeature('fixed-assets')
  findAllCategories(@CurrentTenant() tenantId: string) {
    return this.categoriesService.findAll(tenantId);
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get asset category by ID' })
  @RequirePermissions('accounting:read:detail')
  @RequirePlanFeature('fixed-assets')
  findOneCategory(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.categoriesService.findOne(tenantId, id);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create asset category' })
  @ApiResponse({ status: 201, description: 'Category created' })
  @ApiResponse({ status: 409, description: 'Duplicate category name' })
  @RequirePermissions('accounting:write:create')
  @RequirePlanFeature('fixed-assets')
  createCategory(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateAssetCategoryDto,
  ) {
    return this.categoriesService.create(tenantId, dto);
  }

  @Put('categories/:id')
  @ApiOperation({ summary: 'Update asset category' })
  @RequirePermissions('accounting:write:update')
  @RequirePlanFeature('fixed-assets')
  updateCategory(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateAssetCategoryDto>,
  ) {
    return this.categoriesService.update(tenantId, id, dto);
  }

  // ── Fixed Assets ──────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List fixed assets with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Paginated asset list' })
  @RequirePermissions('accounting:read:list')
  @RequirePlanFeature('fixed-assets')
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryFixedAssetDto) {
    return this.fixedAssetsService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fixed asset by ID' })
  @ApiResponse({ status: 200, description: 'Asset found' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  @RequirePermissions('accounting:read:detail')
  @RequirePlanFeature('fixed-assets')
  findOne(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.fixedAssetsService.findOne(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create fixed asset' })
  @ApiResponse({ status: 201, description: 'Asset created' })
  @RequirePermissions('accounting:write:create')
  @RequirePlanFeature('fixed-assets')
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateFixedAssetDto,
  ) {
    return this.fixedAssetsService.create(tenantId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update fixed asset' })
  @RequirePermissions('accounting:write:update')
  @RequirePlanFeature('fixed-assets')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFixedAssetDto,
  ) {
    return this.fixedAssetsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete fixed asset (no depreciation entries)' })
  @RequirePermissions('accounting:write:delete')
  @RequirePlanFeature('fixed-assets')
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.fixedAssetsService.remove(tenantId, id);
  }

  // ── Depreciation ──────────────────────────────────────────────

  @Get(':id/depreciation')
  @ApiOperation({ summary: 'Get depreciation history for an asset' })
  @RequirePermissions('accounting:read:detail')
  @RequirePlanFeature('fixed-assets')
  getDepreciationHistory(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.fixedAssetsService.getDepreciationHistory(tenantId, id);
  }

  @Get(':id/schedule')
  @ApiOperation({ summary: 'Get depreciation schedule for an asset' })
  @RequirePermissions('accounting:read:detail')
  @RequirePlanFeature('fixed-assets')
  getSchedule(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.fixedAssetsService.getSchedule(tenantId, id);
  }

  @Post('depreciation/execute')
  @ApiOperation({ summary: 'Execute depreciation for a single asset' })
  @ApiResponse({ status: 201, description: 'Depreciation entry created with journal entry' })
  @RequirePermissions('accounting:write:create')
  @RequirePlanFeature('fixed-assets')
  executeDepreciation(
    @CurrentTenant() tenantId: string,
    @CurrentUser() userId: string,
    @Body() dto: ExecuteDepreciationDto,
  ) {
    return this.depreciationService.executeDepreciation(
      tenantId, userId, dto.fixed_asset_id, dto.fiscal_period_id, dto.entry_date, dto.notes,
    );
  }

  @Post('depreciation/batch')
  @ApiOperation({ summary: 'Execute batch depreciation for all active assets' })
  @ApiResponse({ status: 201, description: 'Batch depreciation results' })
  @RequirePermissions('accounting:write:create')
  @RequirePlanFeature('fixed-assets')
  executeBatchDepreciation(
    @CurrentTenant() tenantId: string,
    @CurrentUser() userId: string,
    @Body() dto: BatchDepreciationDto,
  ) {
    return this.depreciationService.executeBatchDepreciation(
      tenantId, userId, dto.fiscal_period_id, dto.entry_date,
    );
  }

  // ── Disposal ──────────────────────────────────────────────────

  @Post(':id/dispose')
  @ApiOperation({ summary: 'Dispose of a fixed asset (sale, write-off, donation, trade-in)' })
  @ApiResponse({ status: 201, description: 'Asset disposed with journal entry' })
  @RequirePermissions('accounting:write:create')
  @RequirePlanFeature('fixed-assets')
  disposeAsset(
    @CurrentTenant() tenantId: string,
    @CurrentUser() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DisposeAssetDto,
  ) {
    return this.disposalService.disposeAsset(tenantId, userId, id, dto);
  }

  @Get('disposals/all')
  @ApiOperation({ summary: 'List all asset disposals' })
  @RequirePermissions('accounting:read:list')
  @RequirePlanFeature('fixed-assets')
  findAllDisposals(@CurrentTenant() tenantId: string) {
    return this.disposalService.findDisposals(tenantId);
  }
}

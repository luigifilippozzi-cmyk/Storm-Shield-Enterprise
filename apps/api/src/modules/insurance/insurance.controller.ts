import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InsuranceService } from './insurance.service';
import { CreateInsuranceCompanyDto, UpdateInsuranceCompanyDto, QueryInsuranceCompanyDto } from './dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('insurance')
@ApiBearerAuth()
@UseGuards(AuthGuard, TenantGuard, RbacGuard)
@Controller('insurance')
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  @Get('seed-list')
  @ApiOperation({ summary: 'Top 5 US insurance companies — pre-populated for onboarding wizard' })
  @ApiResponse({ status: 200, description: 'Seed list of common insurers' })
  getSeedList() {
    return this.insuranceService.getSeedList();
  }

  @Get()
  @ApiOperation({ summary: 'List insurance companies with pagination and search' })
  @ApiResponse({ status: 200, description: 'Paginated insurance company list' })
  @RequirePermissions('insurance:read:list')
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryInsuranceCompanyDto) {
    return this.insuranceService.findAll(tenantId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new insurance company' })
  @ApiResponse({ status: 201, description: 'Insurance company created' })
  @RequirePermissions('insurance:write:create')
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateInsuranceCompanyDto) {
    return this.insuranceService.create(tenantId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get insurance company by ID' })
  @ApiResponse({ status: 200, description: 'Insurance company found' })
  @ApiResponse({ status: 404, description: 'Insurance company not found' })
  @RequirePermissions('insurance:read:detail')
  findOne(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.insuranceService.findOne(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update insurance company' })
  @ApiResponse({ status: 200, description: 'Insurance company updated' })
  @RequirePermissions('insurance:write:update')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInsuranceCompanyDto,
  ) {
    return this.insuranceService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete insurance company' })
  @ApiResponse({ status: 200, description: 'Insurance company deleted' })
  @RequirePermissions('insurance:write:delete')
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.insuranceService.remove(tenantId, id);
  }
}

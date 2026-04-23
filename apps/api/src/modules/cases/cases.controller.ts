import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { QueryCaseDto } from './dto/query-case.dto';
import { ResolveCaseDto } from './dto/resolve-case.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { PlanGuard, RequirePlanFeature } from '../../common/guards/plan.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('cases')
@ApiBearerAuth()
@UseGuards(AuthGuard, TenantGuard, RbacGuard, PlanGuard)
@RequirePlanFeature('cases')
@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get()
  @ApiOperation({ summary: 'List cases with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated case list' })
  @RequirePermissions('cases:read:list')
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryCaseDto) {
    return this.casesService.findAll(tenantId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Open a new case' })
  @ApiResponse({ status: 201, description: 'Case created' })
  @RequirePermissions('cases:write:create')
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCaseDto,
  ) {
    return this.casesService.create(tenantId, userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get case by ID' })
  @ApiResponse({ status: 200, description: 'Case found' })
  @ApiResponse({ status: 404, description: 'Case not found' })
  @RequirePermissions('cases:read:detail')
  findOne(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.casesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update case (status, priority, assignment)' })
  @ApiResponse({ status: 200, description: 'Case updated' })
  @RequirePermissions('cases:write:update')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateCaseDto,
  ) {
    return this.casesService.update(tenantId, id, userId, dto);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Resolve a case with optional resolution notes' })
  @ApiResponse({ status: 200, description: 'Case resolved' })
  @RequirePermissions('cases:write:update')
  resolve(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ResolveCaseDto,
  ) {
    return this.casesService.resolve(tenantId, id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a case' })
  @ApiResponse({ status: 200, description: 'Case deleted' })
  @RequirePermissions('cases:write:delete')
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.casesService.remove(tenantId, id, userId);
  }
}

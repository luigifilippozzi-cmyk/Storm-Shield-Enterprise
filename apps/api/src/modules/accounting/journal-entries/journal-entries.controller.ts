import {
  Controller, Get, Post, Delete,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JournalEntriesService } from './journal-entries.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { QueryJournalEntryDto } from './dto/query-journal-entry.dto';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { PlanGuard, RequirePlanFeature } from '../../../common/guards/plan.guard';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@ApiTags('accounting / journal-entries')
@ApiBearerAuth()
@UseGuards(AuthGuard, TenantGuard, RbacGuard, PlanGuard)
@Controller('accounting/journal-entries')
export class JournalEntriesController {
  constructor(private readonly journalEntriesService: JournalEntriesService) {}

  @Get()
  @ApiOperation({ summary: 'List journal entries with pagination and filters' })
  @ApiResponse({ status: 200 })
  @RequirePermissions('accounting:read:list')
  @RequirePlanFeature('accounting')
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryJournalEntryDto) {
    return this.journalEntriesService.findAll(tenantId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new journal entry with lines (must balance)' })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 400, description: 'Entry does not balance or invalid data' })
  @RequirePermissions('accounting:write:create')
  @RequirePlanFeature('accounting')
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateJournalEntryDto,
  ) {
    return this.journalEntriesService.create(tenantId, userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get journal entry with lines' })
  @ApiResponse({ status: 200 })
  @RequirePermissions('accounting:read:detail')
  @RequirePlanFeature('accounting')
  findOne(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.journalEntriesService.findOne(tenantId, id);
  }

  @Post(':id/post')
  @ApiOperation({ summary: 'Post a draft journal entry to the GL' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'Entry not in draft or period closed' })
  @RequirePermissions('accounting:write:update')
  @RequirePlanFeature('accounting')
  post(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.journalEntriesService.post(tenantId, id, userId);
  }

  @Post(':id/reverse')
  @ApiOperation({ summary: 'Reverse a posted journal entry' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'Entry not posted or no open period' })
  @RequirePermissions('accounting:write:update')
  @RequirePlanFeature('accounting')
  reverse(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { description?: string },
  ) {
    return this.journalEntriesService.reverse(tenantId, id, userId, body?.description);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a draft journal entry' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400, description: 'Only draft entries can be deleted' })
  @RequirePermissions('accounting:write:delete')
  @RequirePlanFeature('accounting')
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.journalEntriesService.remove(tenantId, id);
  }
}

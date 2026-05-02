import { Controller, Get, Post, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { SuperUserGuard } from '../../common/guards/super-user.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RecordWizardStepDto } from './dto/record-wizard-step.dto';
import { ProvisionTenantAdminDto } from './dto/provision-tenant-admin.dto';

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Provision a new tenant (requires authenticated Clerk user)' })
  create(@Body() body: any) {
    return this.tenantsService.create(body);
  }

  // Wizard routes declared before /:id to avoid routing conflict
  @Get('me/wizard/status')
  @UseGuards(AuthGuard, TenantGuard)
  @ApiOperation({ summary: 'Get current wizard status for the authenticated tenant' })
  getWizardStatus(@CurrentTenant() tenantId: string) {
    return this.tenantsService.getWizardStatus(tenantId);
  }

  @Post('me/wizard/start')
  @UseGuards(AuthGuard, TenantGuard)
  @ApiOperation({ summary: 'Record wizard_started activation event' })
  startWizard(@CurrentTenant() tenantId: string, @CurrentUser() user: any) {
    return this.tenantsService.startWizard(tenantId, user?.id);
  }

  @Post('me/wizard/step')
  @UseGuards(AuthGuard, TenantGuard)
  @ApiOperation({ summary: 'Record wizard step completion event' })
  recordWizardStep(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: RecordWizardStepDto,
  ) {
    return this.tenantsService.recordWizardStep(tenantId, dto.step, user?.id);
  }

  @Post('me/wizard/complete')
  @UseGuards(AuthGuard, TenantGuard)
  @ApiOperation({ summary: 'Mark setup wizard as completed' })
  completeWizard(@CurrentTenant() tenantId: string, @CurrentUser() user: any) {
    return this.tenantsService.completeWizard(tenantId, user?.id);
  }

  @Post('me/wizard/skip')
  @UseGuards(AuthGuard, TenantGuard)
  @ApiOperation({ summary: 'Skip setup wizard (marks tenant as wizard_skipped)' })
  skipWizard(@CurrentTenant() tenantId: string, @CurrentUser() user: any) {
    return this.tenantsService.skipWizard(tenantId, user?.id);
  }

  @Get(':id')
  @UseGuards(AuthGuard, TenantGuard)
  @ApiOperation({ summary: 'Get own tenant info (must match authenticated tenant context)' })
  findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    if (id !== tenantId) {
      throw new ForbiddenException('You may only access your own tenant');
    }
    return this.tenantsService.findOneSafe(id);
  }

  // ─── Platform Admin (super user only) ─────────────────────────────────────

  @Get('platform-admin/tenants')
  @UseGuards(AuthGuard, SuperUserGuard)
  @ApiOperation({ summary: '[Super User] List all tenants cross-tenant' })
  listAllTenants() {
    return this.tenantsService.listAllForSuperUser();
  }

  @Post('platform-admin/tenants/:id/admin')
  @UseGuards(AuthGuard, SuperUserGuard)
  @ApiOperation({ summary: '[Super User] Provision owner/admin in a specific tenant' })
  provisionTenantAdmin(
    @Param('id') tenantId: string,
    @Body() dto: ProvisionTenantAdminDto,
    @Request() req: any,
  ) {
    return this.tenantsService.provisionTenantAdmin(tenantId, dto, req.superUserEmail);
  }
}

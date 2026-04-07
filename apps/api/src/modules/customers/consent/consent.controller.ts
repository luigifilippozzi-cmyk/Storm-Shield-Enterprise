import {
  Controller, Get, Post, Delete,
  Body, Param, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConsentService } from './consent.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { RbacGuard } from '../../../common/guards/rbac.guard';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@ApiTags('customer-consent')
@ApiBearerAuth()
@UseGuards(AuthGuard, TenantGuard, RbacGuard)
@Controller('customers/:customerId/consent')
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Get()
  @ApiOperation({ summary: 'List consent records for a customer' })
  @ApiResponse({ status: 200, description: 'Consent records list' })
  @RequirePermissions('customers:read:consent')
  findByCustomer(
    @CurrentTenant() tenantId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ) {
    return this.consentService.findByCustomer(tenantId, customerId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a consent record' })
  @ApiResponse({ status: 201, description: 'Consent record created' })
  @RequirePermissions('customers:write:consent')
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() dto: CreateConsentDto,
  ) {
    return this.consentService.create(tenantId, customerId, userId, dto);
  }

  @Delete(':consentId')
  @ApiOperation({ summary: 'Revoke a consent record' })
  @ApiResponse({ status: 200, description: 'Consent revoked' })
  @RequirePermissions('customers:write:consent')
  revoke(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Param('consentId', ParseUUIDPipe) consentId: string,
  ) {
    return this.consentService.revoke(tenantId, customerId, consentId, userId);
  }
}

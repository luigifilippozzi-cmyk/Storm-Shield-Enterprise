import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { getPrimaryWorkspace, getAvailableWorkspaces } from '../../lib/workspace';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: any) {
    return user;
  }

  @Get('workspace-info')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get workspace routing info for the current user' })
  @ApiResponse({ status: 200, description: 'Primary workspace, available workspaces, and roles' })
  workspaceInfo(@CurrentUser() user: any) {
    const roles: string[] = user?.roles ?? [];
    return {
      roles,
      primaryWorkspace: getPrimaryWorkspace(roles),
      availableWorkspaces: getAvailableWorkspaces(roles),
    };
  }

  @Get('tenant-context')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Bootstrap tenant context — find which tenant the authenticated user belongs to' })
  @ApiResponse({ status: 200, description: 'Tenant context: tenantId, tenantName, tenantPlan' })
  @ApiResponse({ status: 404, description: 'No active tenant found for this user' })
  async tenantContext(@CurrentUser() user: any) {
    const clerkUserId: string | undefined = user?.clerkUserId;
    if (!clerkUserId) {
      throw new NotFoundException('User not found');
    }
    const ctx = await this.authService.getTenantContext(clerkUserId);
    if (!ctx) {
      throw new NotFoundException('No tenant found for this user');
    }
    return ctx;
  }
}

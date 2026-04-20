import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { getPrimaryWorkspace, getAvailableWorkspaces } from '../../lib/workspace';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
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
}

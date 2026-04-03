import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  @Get('me')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: any) {
    return user;
  }
}

import {
  Controller,
  Get,
  Query,
  ForbiddenException,
  Headers,
  ParseIntPipe,
  DefaultValuePipe,
  Optional,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ActivationEventsService } from './activation.service';

@ApiTags('admin')
@ApiHeader({ name: 'x-sse-admin-key', description: 'SSE internal admin key', required: true })
@Controller('admin/activation')
export class ActivationController {
  private readonly adminKey: string | undefined;

  constructor(
    private readonly svc: ActivationEventsService,
    @Optional() private readonly config?: ConfigService,
  ) {
    this.adminKey = config?.get<string>('SSE_ADMIN_KEY');
  }

  private authorize(key: string | undefined): void {
    if (!this.adminKey) return; // Dev mode: no key configured = open
    if (key !== this.adminKey) {
      throw new ForbiddenException('Invalid admin key');
    }
  }

  @Get('rate')
  @ApiOperation({ summary: 'Activation rate over a period' })
  @ApiQuery({ name: 'period', required: false, type: Number, description: 'Days (default 30)' })
  async getRate(
    @Headers('x-sse-admin-key') key: string | undefined,
    @Query('period', new DefaultValuePipe(30), ParseIntPipe) period: number,
  ) {
    this.authorize(key);
    return this.svc.getRate(period);
  }

  @Get('funnel')
  @ApiOperation({ summary: 'Activation funnel by step over a period' })
  @ApiQuery({ name: 'period', required: false, type: Number, description: 'Days (default 30)' })
  async getFunnel(
    @Headers('x-sse-admin-key') key: string | undefined,
    @Query('period', new DefaultValuePipe(30), ParseIntPipe) period: number,
  ) {
    this.authorize(key);
    return this.svc.getFunnel(period);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Recent activation events (last 50)' })
  async getRecent(
    @Headers('x-sse-admin-key') key: string | undefined,
  ) {
    this.authorize(key);
    return this.svc.getRecent(50);
  }
}

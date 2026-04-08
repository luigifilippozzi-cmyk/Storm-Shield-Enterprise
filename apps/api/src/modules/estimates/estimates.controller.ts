import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { EstimatesService } from './estimates.service';
import { CreateEstimateDto } from './dto/create-estimate.dto';
import { UpdateEstimateDto } from './dto/update-estimate.dto';
import { QueryEstimateDto } from './dto/query-estimate.dto';
import { UpdateEstimateStatusDto } from './dto/update-status.dto';
import { CreateSupplementDto } from './dto/create-supplement.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('estimates')
@ApiBearerAuth()
@UseGuards(AuthGuard, TenantGuard, RbacGuard)
@Controller('estimates')
export class EstimatesController {
  constructor(private readonly estimatesService: EstimatesService) {}

  @Get()
  @ApiOperation({ summary: 'List estimates with pagination, search, and filters' })
  @ApiResponse({ status: 200, description: 'Paginated estimate list' })
  @RequirePermissions('estimates:read:list')
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryEstimateDto) {
    return this.estimatesService.findAll(tenantId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new estimate with optional line items' })
  @ApiResponse({ status: 201, description: 'Estimate created' })
  @RequirePermissions('estimates:write:create')
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateEstimateDto) {
    return this.estimatesService.create(tenantId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get estimate by ID with lines and supplements' })
  @ApiResponse({ status: 200, description: 'Estimate found' })
  @ApiResponse({ status: 404, description: 'Estimate not found' })
  @RequirePermissions('estimates:read:detail')
  findOne(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.estimatesService.findOne(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update estimate (draft only)' })
  @ApiResponse({ status: 200, description: 'Estimate updated' })
  @RequirePermissions('estimates:write:update')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEstimateDto,
  ) {
    return this.estimatesService.update(tenantId, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update estimate status with workflow validation' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @RequirePermissions('estimates:write:update')
  updateStatus(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEstimateStatusDto,
  ) {
    return this.estimatesService.updateStatus(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete estimate (draft only)' })
  @ApiResponse({ status: 200, description: 'Estimate deleted' })
  @RequirePermissions('estimates:write:delete')
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.estimatesService.remove(tenantId, id);
  }

  // ── Estimate Documents ──

  @Get(':id/documents')
  @ApiOperation({ summary: 'List estimate documents' })
  @ApiResponse({ status: 200, description: 'Document list' })
  @RequirePermissions('estimates:read:detail')
  getDocuments(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.estimatesService.getDocuments(tenantId, id);
  }

  @Post(':id/documents')
  @ApiOperation({ summary: 'Upload a document to an estimate' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        document_type: { type: 'string', enum: ['insurance_estimate', 'supplement', 'photo', 'invoice', 'other'] },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Document uploaded' })
  @RequirePermissions('estimates:write:update')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 25 * 1024 * 1024 } }))
  attachDocument(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) estimateId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { document_type?: string },
  ) {
    return this.estimatesService.attachDocument(
      tenantId,
      estimateId,
      userId,
      file,
      body.document_type,
    );
  }

  @Delete(':id/documents/:documentId')
  @ApiOperation({ summary: 'Delete an estimate document' })
  @ApiResponse({ status: 200, description: 'Document deleted' })
  @RequirePermissions('estimates:write:update')
  deleteDocument(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) estimateId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ) {
    return this.estimatesService.deleteDocument(tenantId, estimateId, documentId);
  }

  // ── Estimate Supplements ──

  @Get(':id/supplements')
  @ApiOperation({ summary: 'List estimate supplements' })
  @ApiResponse({ status: 200, description: 'Supplement list' })
  @RequirePermissions('estimates:read:detail')
  getSupplements(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.estimatesService.getSupplements(tenantId, id);
  }

  @Post(':id/supplements')
  @ApiOperation({ summary: 'Create a supplement for an estimate' })
  @ApiResponse({ status: 201, description: 'Supplement created' })
  @RequirePermissions('estimates:write:update')
  createSupplement(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) estimateId: string,
    @Body() dto: CreateSupplementDto,
  ) {
    return this.estimatesService.createSupplement(tenantId, estimateId, userId, dto);
  }
}

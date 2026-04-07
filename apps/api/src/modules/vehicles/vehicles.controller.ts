import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards, ParseUUIDPipe,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { QueryVehicleDto } from './dto/query-vehicle.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('vehicles')
@ApiBearerAuth()
@UseGuards(AuthGuard, TenantGuard, RbacGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'List vehicles with pagination and search' })
  @ApiResponse({ status: 200, description: 'Paginated vehicle list' })
  @RequirePermissions('vehicles:read:list')
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryVehicleDto) {
    return this.vehiclesService.findAll(tenantId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new vehicle' })
  @ApiResponse({ status: 201, description: 'Vehicle created' })
  @RequirePermissions('vehicles:write:create')
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(tenantId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle by ID' })
  @ApiResponse({ status: 200, description: 'Vehicle found' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  @RequirePermissions('vehicles:read:detail')
  findOne(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vehiclesService.findOne(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update vehicle' })
  @ApiResponse({ status: 200, description: 'Vehicle updated' })
  @RequirePermissions('vehicles:write:update')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete vehicle' })
  @ApiResponse({ status: 200, description: 'Vehicle deleted' })
  @RequirePermissions('vehicles:write:delete')
  remove(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vehiclesService.remove(tenantId, id);
  }

  // ── Vehicle Photos ──

  @Get(':id/photos')
  @ApiOperation({ summary: 'List vehicle photos' })
  @ApiResponse({ status: 200, description: 'Photo list' })
  @RequirePermissions('vehicles:read:detail')
  getPhotos(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vehiclesService.getPhotos(tenantId, id);
  }

  @Post(':id/photos')
  @ApiOperation({ summary: 'Upload a vehicle photo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        photo_type: { type: 'string', enum: ['general', 'damage', 'before', 'after', 'detail'] },
        description: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Photo uploaded' })
  @RequirePermissions('vehicles:write:update')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  uploadPhoto(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) vehicleId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { photo_type?: string; description?: string },
  ) {
    return this.vehiclesService.uploadPhoto(
      tenantId,
      vehicleId,
      userId,
      file,
      body.photo_type,
      body.description,
    );
  }

  @Delete(':id/photos/:photoId')
  @ApiOperation({ summary: 'Delete a vehicle photo' })
  @ApiResponse({ status: 200, description: 'Photo deleted' })
  @RequirePermissions('vehicles:write:update')
  deletePhoto(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) vehicleId: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
  ) {
    return this.vehiclesService.deletePhoto(tenantId, vehicleId, photoId);
  }
}

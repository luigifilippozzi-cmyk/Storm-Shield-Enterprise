import { Module, Global } from '@nestjs/common';
import { StorageService } from './services/storage.service';
import { SuperUserService } from './services/super-user.service';
import { SuperUserGuard } from './guards/super-user.guard';

@Global()
@Module({
  providers: [StorageService, SuperUserService, SuperUserGuard],
  exports: [StorageService, SuperUserService, SuperUserGuard],
})
export class CommonModule {}

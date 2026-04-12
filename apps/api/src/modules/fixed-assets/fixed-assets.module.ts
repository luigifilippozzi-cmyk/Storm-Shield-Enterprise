import { Module } from '@nestjs/common';
import { FixedAssetsController } from './fixed-assets.controller';
import { FixedAssetsService } from './fixed-assets.service';
import { AssetCategoriesService } from './asset-categories.service';
import { DepreciationService } from './depreciation.service';
import { DisposalService } from './disposal.service';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [AccountingModule],
  controllers: [FixedAssetsController],
  providers: [
    FixedAssetsService,
    AssetCategoriesService,
    DepreciationService,
    DisposalService,
  ],
  exports: [FixedAssetsService, DepreciationService, DisposalService],
})
export class FixedAssetsModule {}

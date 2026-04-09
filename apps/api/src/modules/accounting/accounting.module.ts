import { Module } from '@nestjs/common';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { FiscalPeriodsController } from './fiscal-periods/fiscal-periods.controller';
import { FiscalPeriodsService } from './fiscal-periods/fiscal-periods.service';
import { JournalEntriesController } from './journal-entries/journal-entries.controller';
import { JournalEntriesService } from './journal-entries/journal-entries.service';

@Module({
  controllers: [AccountingController, FiscalPeriodsController, JournalEntriesController],
  providers: [AccountingService, FiscalPeriodsService, JournalEntriesService],
  exports: [AccountingService, FiscalPeriodsService, JournalEntriesService],
})
export class AccountingModule {}

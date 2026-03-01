import { Module } from '@nestjs/common';
import { ImagesController } from './images/images.controller';
import { ImagesService } from './images/images.service';
import { DocumentsController } from './documents/documents.controller';
import { DocumentsService } from './documents/documents.service';
import { SellRecordsController } from './sell-records/sell-records.controller';
import { SellRecordsService } from './sell-records/sell-records.service';
import { BuyRecordsController } from './buy-records/buy-records.controller';
import { BuyRecordsService } from './buy-records/buy-records.service';
import {
  ExpensesController,
  ExpensesStandaloneController,
} from './expenses/expenses.controller';
import { ExpensesService } from './expenses/expenses.service';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

@Module({
  controllers: [
    VehiclesController,
    ImagesController,
    DocumentsController,
    SellRecordsController,
    BuyRecordsController,
    ExpensesController,
    ExpensesStandaloneController,
  ],
  providers: [
    VehiclesService,
    ImagesService,
    DocumentsService,
    SellRecordsService,
    BuyRecordsService,
    ExpensesService,
  ],
  exports: [VehiclesService],
})
export class VehiclesModule {}

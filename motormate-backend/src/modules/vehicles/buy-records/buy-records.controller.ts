import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { BuyRecordsService } from './buy-records.service';
import { CreateBuyRecordDto } from './dto/create-buy-record.dto';

@UseGuards(JwtAuthGuard)
@Controller('vehicles/:vehicleId/buy-record')
export class BuyRecordsController {
  constructor(private readonly buyRecordsService: BuyRecordsService) {}

  @Get()
  get(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.buyRecordsService.get(vehicleId, user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateBuyRecordDto,
  ) {
    return this.buyRecordsService.create(vehicleId, user.id, dto);
  }

  @Get('profit')
  getProfit(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.buyRecordsService.getProfit(vehicleId, user.id);
  }
}

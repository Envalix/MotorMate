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
import { SellRecordsService } from './sell-records.service';
import { CreateSellRecordDto } from './dto/create-sell-record.dto';

@UseGuards(JwtAuthGuard)
@Controller('vehicles/:vehicleId/sell-record')
export class SellRecordsController {
  constructor(private readonly sellRecordsService: SellRecordsService) {}

  @Get()
  get(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.sellRecordsService.getSellRecord(vehicleId, user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateSellRecordDto,
  ) {
    return this.sellRecordsService.createSellRecord(vehicleId, user.id, dto);
  }
}

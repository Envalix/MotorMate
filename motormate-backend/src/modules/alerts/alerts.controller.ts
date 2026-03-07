import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AlertsService } from './alerts.service';

@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get('expiring')
  getExpiring(@CurrentUser() user: { id: string }) {
    return this.alertsService.getExpiringDocuments(user.id);
  }
}

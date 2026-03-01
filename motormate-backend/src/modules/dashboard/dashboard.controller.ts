import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: { id: string }) {
    return this.dashboardService.getSummary(user.id);
  }

  @Get('aging')
  getAging(@CurrentUser() user: { id: string }) {
    return this.dashboardService.getAging(user.id);
  }

  @Get('profit-by-month')
  getProfitByMonth(@CurrentUser() user: { id: string }) {
    return this.dashboardService.getProfitByMonth(user.id);
  }

  @Get('expense-by-category')
  getExpenseByCategory(@CurrentUser() user: { id: string }) {
    return this.dashboardService.getExpenseByCategory(user.id);
  }
}

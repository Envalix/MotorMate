import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── GET /dashboard/summary ───────────────────────────────────────────────

  async getSummary(userId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [inStockVehicles, soldThisMonth, soldVehicles] = await Promise.all([
      // All in-stock vehicles (for inventory value)
      this.prisma.vehicle.findMany({
        where: { userId, status: 'IN_STOCK', deletedAt: null },
        select: { sellingPrice: true, purchasePrice: true },
      }),
      // Sold this month count (via sellRecord.saleDate)
      this.prisma.sellRecord.count({
        where: {
          userId,
          saleDate: { gte: monthStart },
        },
      }),
      // All sold vehicles for avg profit calc
      this.prisma.sellRecord.findMany({
        where: { userId },
        select: { vehicleId: true, sellingPrice: true },
      }),
    ]);

    // Total inventory value (asking price if set, else purchase price)
    const totalInventoryValue = inStockVehicles.reduce((sum, v) => {
      const price = v.sellingPrice ?? v.purchasePrice;
      return sum.plus(price.toString());
    }, new Decimal(0));

    // Avg net profit across all sold vehicles
    let avgNetProfit: string | null = null;
    if (soldVehicles.length > 0) {
      const vehicleIds = soldVehicles.map((s) => s.vehicleId);

      const [buyRecords, expenseAggs] = await Promise.all([
        this.prisma.buyRecord.findMany({
          where: { vehicleId: { in: vehicleIds } },
          select: { vehicleId: true, purchasePrice: true },
        }),
        this.prisma.expense.groupBy({
          by: ['vehicleId'],
          where: { vehicleId: { in: vehicleIds } },
          _sum: { amount: true },
        }),
      ]);

      const buyMap = new Map(
        buyRecords.map((b) => [b.vehicleId, b.purchasePrice]),
      );
      const expMap = new Map(
        expenseAggs.map((e) => [
          e.vehicleId,
          new Decimal(e._sum.amount?.toString() ?? '0'),
        ]),
      );

      let totalProfit = new Decimal(0);
      let countWithBuy = 0;

      for (const s of soldVehicles) {
        const buy = buyMap.get(s.vehicleId);
        if (!buy) continue;
        const cost = new Decimal(buy.toString()).plus(
          expMap.get(s.vehicleId) ?? new Decimal(0),
        );
        totalProfit = totalProfit.plus(
          new Decimal(s.sellingPrice.toString()).minus(cost),
        );
        countWithBuy++;
      }

      if (countWithBuy > 0) {
        avgNetProfit = totalProfit.div(countWithBuy).toFixed(2);
      }
    }

    return {
      totalInventoryValue: totalInventoryValue.toFixed(2),
      inStockCount: inStockVehicles.length,
      soldThisMonth,
      avgNetProfit,
    };
  }

  // ─── GET /dashboard/aging ─────────────────────────────────────────────────

  async getAging(userId: string) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { userId, status: 'IN_STOCK', deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        plateNumber: true,
        vin: true,
        purchasePrice: true,
        sellingPrice: true,
        createdAt: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
      },
    });

    const now = Date.now();
    return vehicles.map((v) => ({
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      plateNumber: v.plateNumber,
      vin: v.vin,
      purchasePrice: v.purchasePrice.toFixed(2),
      sellingPrice: v.sellingPrice?.toFixed(2) ?? null,
      imageUrl: v.images[0]?.url ?? null,
      daysInStock: Math.floor((now - v.createdAt.getTime()) / 86_400_000),
    }));
  }

  // ─── GET /dashboard/profit-by-month ───────────────────────────────────────

  async getProfitByMonth(userId: string) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 11);
    cutoff.setDate(1);
    cutoff.setHours(0, 0, 0, 0);

    const sellRecords = await this.prisma.sellRecord.findMany({
      where: { userId, saleDate: { gte: cutoff } },
      select: { vehicleId: true, sellingPrice: true, saleDate: true },
    });

    if (sellRecords.length === 0) {
      return this.emptyMonths();
    }

    const vehicleIds = sellRecords.map((s) => s.vehicleId);

    const [buyRecords, expenseAggs] = await Promise.all([
      this.prisma.buyRecord.findMany({
        where: { vehicleId: { in: vehicleIds } },
        select: { vehicleId: true, purchasePrice: true },
      }),
      this.prisma.expense.groupBy({
        by: ['vehicleId'],
        where: { vehicleId: { in: vehicleIds } },
        _sum: { amount: true },
      }),
    ]);

    const buyMap = new Map(
      buyRecords.map((b) => [b.vehicleId, b.purchasePrice]),
    );
    const expMap = new Map(
      expenseAggs.map((e) => [
        e.vehicleId,
        new Decimal(e._sum.amount?.toString() ?? '0'),
      ]),
    );

    // Accumulate profit per month key "YYYY-MM"
    const byMonth = new Map<string, Decimal>();

    for (const s of sellRecords) {
      const key = s.saleDate.toISOString().slice(0, 7); // "YYYY-MM"
      const buy = buyMap.get(s.vehicleId);
      const cost = buy
        ? new Decimal(buy.toString()).plus(
            expMap.get(s.vehicleId) ?? new Decimal(0),
          )
        : new Decimal(0);
      const profit = new Decimal(s.sellingPrice.toString()).minus(cost);
      byMonth.set(key, (byMonth.get(key) ?? new Decimal(0)).plus(profit));
    }

    return this.emptyMonths().map((m) => ({
      ...m,
      netProfit: Number(byMonth.get(m.month)?.toFixed(2) ?? 0),
    }));
  }

  // ─── GET /dashboard/expense-by-category ──────────────────────────────────

  async getExpenseByCategory(userId: string) {
    const rows = await this.prisma.expense.groupBy({
      by: ['category'],
      where: { userId },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    return rows.map((r) => ({
      category: r.category,
      total: new Decimal(r._sum.amount?.toString() ?? '0').toFixed(2),
    }));
  }

  // ─── Helper — last 12 month labels ───────────────────────────────────────

  private emptyMonths() {
    const months: { month: string; label: string; netProfit: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString('en-LK', {
        month: 'short',
        year: '2-digit',
      });
      months.push({ month: key, label, netProfit: 0 });
    }
    return months;
  }
}

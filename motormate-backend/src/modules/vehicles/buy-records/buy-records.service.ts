import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import Decimal from 'decimal.js';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateBuyRecordDto } from './dto/create-buy-record.dto';

@Injectable()
export class BuyRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertOwner(vehicleId: string, userId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, userId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return vehicle;
  }

  // ─── Create buy record (one-time) ─────────────────────────────────────────

  async create(vehicleId: string, userId: string, dto: CreateBuyRecordDto) {
    await this.assertOwner(vehicleId, userId);

    const existing = await this.prisma.buyRecord.findUnique({
      where: { vehicleId },
    });
    if (existing) {
      throw new BadRequestException(
        'A buy record already exists for this vehicle',
      );
    }

    return this.prisma.buyRecord.create({
      data: {
        vehicleId,
        userId,
        purchasePrice: dto.purchasePrice,
        purchaseDate: new Date(dto.purchaseDate),
        paymentMethod: dto.paymentMethod,
        sellerName: dto.sellerName,
        sellerNic: dto.sellerNic,
        sellerContact: dto.sellerContact,
        sellerAddress: dto.sellerAddress,
        notes: dto.notes,
      },
    });
  }

  // ─── Get buy record ───────────────────────────────────────────────────────

  async get(vehicleId: string, userId: string) {
    await this.assertOwner(vehicleId, userId);
    return this.prisma.buyRecord.findUnique({ where: { vehicleId } });
  }

  // ─── Profit summary ───────────────────────────────────────────────────────

  async getProfit(vehicleId: string, userId: string) {
    await this.assertOwner(vehicleId, userId);

    const [buyRecord, expenseAgg, sellRecord] = await Promise.all([
      this.prisma.buyRecord.findUnique({ where: { vehicleId } }),
      this.prisma.expense.aggregate({
        where: { vehicleId },
        _sum: { amount: true },
      }),
      this.prisma.sellRecord.findUnique({ where: { vehicleId } }),
    ]);

    const buyPrice = buyRecord
      ? new Decimal(buyRecord.purchasePrice.toString())
      : null;
    const totalExpenses = new Decimal(
      expenseAgg._sum.amount?.toString() ?? '0',
    );
    const sellPrice = sellRecord
      ? new Decimal(sellRecord.sellingPrice.toString())
      : null;

    let netProfit: Decimal | null = null;
    let profitPercentage: number | null = null;

    if (buyPrice !== null && sellPrice !== null) {
      const cost = buyPrice.plus(totalExpenses);
      netProfit = sellPrice.minus(cost);
      if (cost.gt(0)) {
        profitPercentage = netProfit
          .div(cost)
          .times(100)
          .toDecimalPlaces(2)
          .toNumber();
      }
    }

    return {
      buyPrice: buyPrice?.toFixed(2) ?? null,
      totalExpenses: totalExpenses.toFixed(2),
      sellPrice: sellPrice?.toFixed(2) ?? null,
      netProfit: netProfit?.toFixed(2) ?? null,
      profitPercentage,
    };
  }
}

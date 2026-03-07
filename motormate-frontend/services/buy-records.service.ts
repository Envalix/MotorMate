import { PaymentMethod, PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

export class BuyRecordsService {
  constructor(private readonly prisma: PrismaClient) {}

  private async assertOwner(vehicleId: string, userId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, userId, deletedAt: null },
    });
    if (!vehicle) throw new Error('NOT_FOUND:Vehicle not found');
    return vehicle;
  }

  async create(
    vehicleId: string,
    userId: string,
    dto: {
      purchasePrice: string;
      purchaseDate: string;
      paymentMethod?: PaymentMethod;
      sellerName?: string;
      sellerNic?: string;
      sellerContact?: string;
      sellerAddress?: string;
      notes?: string;
    },
  ) {
    await this.assertOwner(vehicleId, userId);

    const existing = await this.prisma.buyRecord.findUnique({ where: { vehicleId } });
    if (existing) throw new Error('BAD_REQUEST:A buy record already exists for this vehicle');

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

  async get(vehicleId: string, userId: string) {
    await this.assertOwner(vehicleId, userId);
    return this.prisma.buyRecord.findUnique({ where: { vehicleId } });
  }

  async getProfit(vehicleId: string, userId: string) {
    await this.assertOwner(vehicleId, userId);

    const [buyRecord, expenseAgg, sellRecord] = await Promise.all([
      this.prisma.buyRecord.findUnique({ where: { vehicleId } }),
      this.prisma.expense.aggregate({ where: { vehicleId }, _sum: { amount: true } }),
      this.prisma.sellRecord.findUnique({ where: { vehicleId } }),
    ]);

    const buyPrice = buyRecord ? new Decimal(buyRecord.purchasePrice.toString()) : null;
    const totalExpenses = new Decimal(expenseAgg._sum.amount?.toString() ?? '0');
    const sellPrice = sellRecord ? new Decimal(sellRecord.sellingPrice.toString()) : null;

    let netProfit: Decimal | null = null;
    let profitPercentage: number | null = null;

    if (buyPrice !== null && sellPrice !== null) {
      const cost = buyPrice.plus(totalExpenses);
      netProfit = sellPrice.minus(cost);
      if (cost.gt(0)) {
        profitPercentage = netProfit.div(cost).times(100).toDecimalPlaces(2).toNumber();
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

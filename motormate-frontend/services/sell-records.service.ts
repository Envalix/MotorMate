import { PaymentMethod, PrismaClient, VehicleStatus } from '@prisma/client';
import Decimal from 'decimal.js';
import { DocumentsService } from './documents.service';

export class SellRecordsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly documentsService: DocumentsService,
  ) {}

  private async assertOwner(vehicleId: string, userId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, userId, deletedAt: null },
    });
    if (!vehicle) throw new Error('NOT_FOUND:Vehicle not found');
    return vehicle;
  }

  private async computeProfit(vehicleId: string) {
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

  async createSellRecord(
    vehicleId: string,
    userId: string,
    dto: {
      sellingPrice: string;
      saleDate: string;
      paymentMethod?: PaymentMethod;
      buyerName?: string;
      buyerNic?: string;
      buyerContact?: string;
      buyerAddress?: string;
      notes?: string;
    },
  ) {
    await this.assertOwner(vehicleId, userId);

    const existing = await this.prisma.sellRecord.findUnique({ where: { vehicleId } });
    if (existing) throw new Error('BAD_REQUEST:A sell record already exists for this vehicle');

    const [sellRecord] = await this.prisma.$transaction([
      this.prisma.sellRecord.create({
        data: {
          vehicleId,
          userId,
          sellingPrice: dto.sellingPrice,
          saleDate: new Date(dto.saleDate),
          paymentMethod: dto.paymentMethod,
          buyerName: dto.buyerName,
          buyerNic: dto.buyerNic,
          buyerContact: dto.buyerContact,
          buyerAddress: dto.buyerAddress,
          notes: dto.notes,
        },
      }),
      this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: VehicleStatus.SOLD },
      }),
    ]);

    await this.documentsService.lockDocuments(vehicleId);

    const profit = await this.computeProfit(vehicleId);
    return { sellRecord, profit };
  }

  async getSellRecord(vehicleId: string, userId: string) {
    await this.assertOwner(vehicleId, userId);

    const sellRecord = await this.prisma.sellRecord.findUnique({ where: { vehicleId } });
    if (!sellRecord) return null;

    const profit = await this.computeProfit(vehicleId);
    return { sellRecord, profit };
  }
}

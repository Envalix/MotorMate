import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VehicleStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { DocumentsService } from '../documents/documents.service';
import { CreateSellRecordDto } from './dto/create-sell-record.dto';

@Injectable()
export class SellRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentsService: DocumentsService,
  ) {}

  async createSellRecord(
    vehicleId: string,
    userId: string,
    dto: CreateSellRecordDto,
  ) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, userId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    const existing = await this.prisma.sellRecord.findUnique({
      where: { vehicleId },
    });
    if (existing) {
      throw new BadRequestException('A sell record already exists for this vehicle');
    }

    const [sellRecord] = await this.prisma.$transaction([
      this.prisma.sellRecord.create({
        data: {
          vehicleId,
          userId,
          sellingPrice: dto.sellingPrice,
          saleDate: new Date(dto.saleDate),
          paymentMethod: dto.paymentMethod,
          buyerName: dto.buyerName,
          buyerContact: dto.buyerContact,
          notes: dto.notes,
        },
      }),
      this.prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: VehicleStatus.SOLD },
      }),
    ]);

    // Lock all documents — runs outside transaction (non-critical)
    await this.documentsService.lockDocuments(vehicleId);

    return sellRecord;
  }

  async getSellRecord(vehicleId: string, userId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, userId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    return this.prisma.sellRecord.findUnique({ where: { vehicleId } });
  }
}

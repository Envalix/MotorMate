import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

export interface ExpiryItem {
  docId: string;
  vehicleId: string;
  vehiclePlate: string | null;
  vehicleMake: string;
  vehicleModel: string;
  docType: string;
  expiryDate: string;
  daysRemaining: number;
}

export interface ExpiryAlerts {
  expired: ExpiryItem[];
  critical: ExpiryItem[]; // 1–7 days
  warning: ExpiryItem[]; // 8–30 days
  totalCount: number;
}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── GET /alerts/expiring ─────────────────────────────────────────────────

  async getExpiringDocuments(userId: string): Promise<ExpiryAlerts> {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const docs = await this.prisma.vehicleDocument.findMany({
      where: {
        expiryDate: { not: null, lte: in30 },
        vehicle: { userId, deletedAt: null },
      },
      include: {
        vehicle: {
          select: { id: true, make: true, model: true, plateNumber: true },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    const expired: ExpiryItem[] = [];
    const critical: ExpiryItem[] = [];
    const warning: ExpiryItem[] = [];

    for (const doc of docs) {
      const expiry = doc.expiryDate!;
      const msRemaining = expiry.getTime() - now.getTime();
      const daysRemaining = Math.ceil(msRemaining / 86_400_000);

      const item: ExpiryItem = {
        docId: doc.id,
        vehicleId: doc.vehicle.id,
        vehiclePlate: doc.vehicle.plateNumber,
        vehicleMake: doc.vehicle.make,
        vehicleModel: doc.vehicle.model,
        docType: doc.docType,
        expiryDate: expiry.toISOString(),
        daysRemaining,
      };

      if (daysRemaining <= 0) expired.push(item);
      else if (daysRemaining <= 7) critical.push(item);
      else warning.push(item);
    }

    return {
      expired,
      critical,
      warning,
      totalCount: expired.length + critical.length + warning.length,
    };
  }

  // ─── Daily cron — 8 AM ───────────────────────────────────────────────────

  @Cron('0 8 * * *')
  async dailyExpiryCheck() {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const docs = await this.prisma.vehicleDocument.findMany({
      where: {
        expiryDate: { not: null, lte: in30 },
        isLocked: false,
        vehicle: { deletedAt: null },
      },
      include: {
        vehicle: { select: { plateNumber: true, make: true, model: true } },
      },
    });

    if (docs.length === 0) {
      this.logger.log('[ExpiryCheck] No expiring documents found.');
      return;
    }

    this.logger.warn(
      `[ExpiryCheck] ${docs.length} document(s) expiring within 30 days:`,
    );
    for (const doc of docs) {
      const days = Math.ceil(
        (doc.expiryDate!.getTime() - now.getTime()) / 86_400_000,
      );
      const v = doc.vehicle;
      this.logger.warn(
        `  • ${v.plateNumber ?? `${v.make} ${v.model}`} — ${doc.docType} — ${days}d remaining`,
      );
    }
  }
}

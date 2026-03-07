import { PrismaClient } from '@prisma/client';

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
  critical: ExpiryItem[];
  warning: ExpiryItem[];
  totalCount: number;
}

export class AlertsService {
  constructor(private readonly prisma: PrismaClient) {}

  async getExpiringDocuments(userId: string): Promise<ExpiryAlerts> {
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const docs = await this.prisma.vehicleDocument.findMany({
      where: {
        expiryDate: { not: null, lte: in30 },
        vehicle: { userId, deletedAt: null },
      },
      include: {
        vehicle: { select: { id: true, make: true, model: true, plateNumber: true } },
      },
      orderBy: { expiryDate: 'asc' },
    });

    const expired: ExpiryItem[] = [];
    const critical: ExpiryItem[] = [];
    const warning: ExpiryItem[] = [];

    for (const doc of docs) {
      const expiry = doc.expiryDate!;
      const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / 86_400_000);

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
}

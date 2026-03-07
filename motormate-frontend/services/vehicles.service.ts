import { FuelType, Prisma, PrismaClient, Transmission, VehicleCondition, VehicleStatus, VehicleType } from '@prisma/client';

export class VehiclesService {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(userId: string, filters: { status?: VehicleStatus; search?: string }) {
    const where: Prisma.VehicleWhereInput = { userId, deletedAt: null };

    if (filters.status) where.status = filters.status;

    if (filters.search) {
      const term = filters.search;
      where.OR = [
        { plateNumber: { contains: term, mode: 'insensitive' } },
        { vin: { contains: term, mode: 'insensitive' } },
        { make: { contains: term, mode: 'insensitive' } },
        { model: { contains: term, mode: 'insensitive' } },
      ];
    }

    return this.prisma.vehicle.findMany({
      where,
      include: { images: { where: { isPrimary: true }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, userId, deletedAt: null },
      include: { images: true, documents: true },
    });
    if (!vehicle) throw new Error('NOT_FOUND:Vehicle not found');
    return vehicle;
  }

  async create(userId: string, dto: Record<string, unknown>) {
    return this.prisma.vehicle.create({
      data: {
        userId,
        make: dto.make as string,
        model: dto.model as string,
        year: dto.year as number,
        vin: dto.vin as string | undefined,
        plateNumber: dto.plateNumber as string | undefined,
        color: dto.color as string | undefined,
        engineCC: dto.engineCC as number | undefined,
        mileage: dto.mileage as number | undefined,
        fuelType: dto.fuelType as FuelType | undefined,
        transmission: dto.transmission as Transmission | undefined,
        condition: dto.condition as VehicleCondition | undefined,
        vehicleType: dto.vehicleType as VehicleType | undefined,
        purchasePrice: dto.purchasePrice as string,
        sellingPrice: dto.sellingPrice as string | undefined,
        notes: dto.notes as string | undefined,
      },
    });
  }

  async update(id: string, userId: string, dto: Record<string, unknown>) {
    await this.findOne(id, userId);
    return this.prisma.vehicle.update({ where: { id }, data: dto as Prisma.VehicleUpdateInput });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.vehicle.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

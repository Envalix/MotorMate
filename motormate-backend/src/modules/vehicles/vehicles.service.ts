import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, VehicleStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    filters: { status?: VehicleStatus; search?: string },
  ) {
    const where: Prisma.VehicleWhereInput = {
      userId,
      deletedAt: null,
    };

    if (filters.status) {
      where.status = filters.status;
    }

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

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  async create(userId: string, dto: CreateVehicleDto) {
    return this.prisma.vehicle.create({
      data: {
        userId,
        make: dto.make,
        model: dto.model,
        year: dto.year,
        vin: dto.vin,
        plateNumber: dto.plateNumber,
        color: dto.color,
        engineCC: dto.engineCC,
        mileage: dto.mileage,
        fuelType: dto.fuelType,
        transmission: dto.transmission,
        condition: dto.condition,
        vehicleType: dto.vehicleType,
        purchasePrice: dto.purchasePrice,
        sellingPrice: dto.sellingPrice,
        notes: dto.notes,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateVehicleDto) {
    await this.findOne(id, userId);

    return this.prisma.vehicle.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.vehicle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

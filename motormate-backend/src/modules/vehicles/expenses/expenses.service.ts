import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private uploadBuffer(
    buffer: Buffer,
    originalName: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'motormate/receipts',
            resource_type: 'auto',
            public_id: `${Date.now()}_${originalName.replace(/\.[^/.]+$/, '')}`,
            use_filename: false,
          },
          (err, result) =>
            err ? reject(new Error(err.message)) : resolve(result!),
        )
        .end(buffer);
    });
  }

  private async assertVehicleOwner(vehicleId: string, userId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, userId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return vehicle;
  }

  private async assertExpenseOwner(expenseId: string, userId: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    if (expense.userId !== userId)
      throw new ForbiddenException('Access denied');
    return expense;
  }

  // ─── Create expense ───────────────────────────────────────────────────────

  async create(
    vehicleId: string,
    userId: string,
    dto: CreateExpenseDto,
    file?: Express.Multer.File,
  ) {
    await this.assertVehicleOwner(vehicleId, userId);

    let receiptUrl: string | null = null;
    let receiptPublicId: string | null = null;

    if (file) {
      const result = await this.uploadBuffer(file.buffer, file.originalname);
      receiptUrl = result.secure_url;
      receiptPublicId = result.public_id;
    }

    return this.prisma.expense.create({
      data: {
        vehicleId,
        userId,
        category: dto.category,
        description: dto.description,
        amount: dto.amount,
        date: new Date(dto.date),
        vendor: dto.vendor,
        receiptUrl,
        receiptPublicId,
      },
    });
  }

  // ─── List expenses + total ────────────────────────────────────────────────

  async list(vehicleId: string, userId: string) {
    await this.assertVehicleOwner(vehicleId, userId);

    const [expenses, aggregate] = await Promise.all([
      this.prisma.expense.findMany({
        where: { vehicleId },
        orderBy: { date: 'desc' },
      }),
      this.prisma.expense.aggregate({
        where: { vehicleId },
        _sum: { amount: true },
      }),
    ]);

    return {
      expenses,
      total: aggregate._sum.amount?.toString() ?? '0',
    };
  }

  // ─── Update expense ───────────────────────────────────────────────────────

  async update(
    expenseId: string,
    userId: string,
    dto: UpdateExpenseDto,
    file?: Express.Multer.File,
  ) {
    const expense = await this.assertExpenseOwner(expenseId, userId);

    let receiptUrl = expense.receiptUrl;
    let receiptPublicId = expense.receiptPublicId;

    if (file) {
      // Destroy old receipt from Cloudinary if exists
      if (expense.receiptPublicId) {
        await cloudinary.uploader.destroy(expense.receiptPublicId, {
          resource_type: 'auto',
        });
      }
      const result = await this.uploadBuffer(file.buffer, file.originalname);
      receiptUrl = result.secure_url;
      receiptPublicId = result.public_id;
    }

    return this.prisma.expense.update({
      where: { id: expenseId },
      data: {
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.date !== undefined && { date: new Date(dto.date) }),
        ...(dto.vendor !== undefined && { vendor: dto.vendor }),
        receiptUrl,
        receiptPublicId,
      },
    });
  }

  // ─── Delete expense ───────────────────────────────────────────────────────

  async remove(expenseId: string, userId: string) {
    const expense = await this.assertExpenseOwner(expenseId, userId);

    if (expense.receiptPublicId) {
      await cloudinary.uploader.destroy(expense.receiptPublicId, {
        resource_type: 'auto',
      });
    }

    await this.prisma.expense.delete({ where: { id: expenseId } });
    return { success: true };
  }
}

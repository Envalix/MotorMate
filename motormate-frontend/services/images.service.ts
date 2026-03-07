import { PrismaClient } from '@prisma/client';
import { cloudinary } from '@/lib/cloudinary';
import { UploadApiResponse } from 'cloudinary';

interface FileInput {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export class ImagesService {
  constructor(private readonly prisma: PrismaClient) {}

  private uploadBuffer(buffer: Buffer): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: 'motormate/vehicles', resource_type: 'image' },
          (err, result) => (err ? reject(new Error(err.message)) : resolve(result!)),
        )
        .end(buffer);
    });
  }

  private async assertOwner(vehicleId: string, userId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, userId, deletedAt: null },
    });
    if (!vehicle) throw new Error('NOT_FOUND:Vehicle not found');
    return vehicle;
  }

  async getImages(vehicleId: string, userId: string) {
    await this.assertOwner(vehicleId, userId);
    return this.prisma.vehicleImage.findMany({
      where: { vehicleId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async uploadImages(vehicleId: string, userId: string, files: FileInput[]) {
    await this.assertOwner(vehicleId, userId);

    const existing = await this.prisma.vehicleImage.count({ where: { vehicleId } });
    if (existing + files.length > 10) {
      throw new Error(`BAD_REQUEST:Upload would exceed the 10-image limit. Currently ${existing} image(s) uploaded.`);
    }

    const isFirstBatch = existing === 0;

    return Promise.all(
      files.map(async (file, i) => {
        const result = await this.uploadBuffer(file.buffer);
        return this.prisma.vehicleImage.create({
          data: {
            vehicleId,
            url: result.secure_url,
            publicId: result.public_id,
            isPrimary: isFirstBatch && i === 0,
          },
        });
      }),
    );
  }

  async setPrimary(vehicleId: string, userId: string, imgId: string) {
    await this.assertOwner(vehicleId, userId);

    const image = await this.prisma.vehicleImage.findFirst({ where: { id: imgId, vehicleId } });
    if (!image) throw new Error('NOT_FOUND:Image not found');

    await this.prisma.$transaction([
      this.prisma.vehicleImage.updateMany({ where: { vehicleId }, data: { isPrimary: false } }),
      this.prisma.vehicleImage.update({ where: { id: imgId }, data: { isPrimary: true } }),
    ]);

    return { success: true };
  }

  async deleteImage(vehicleId: string, userId: string, imgId: string) {
    await this.assertOwner(vehicleId, userId);

    const image = await this.prisma.vehicleImage.findFirst({ where: { id: imgId, vehicleId } });
    if (!image) throw new Error('NOT_FOUND:Image not found');

    await cloudinary.uploader.destroy(image.publicId);
    await this.prisma.vehicleImage.delete({ where: { id: imgId } });

    if (image.isPrimary) {
      const next = await this.prisma.vehicleImage.findFirst({
        where: { vehicleId },
        orderBy: { createdAt: 'asc' },
      });
      if (next) {
        await this.prisma.vehicleImage.update({ where: { id: next.id }, data: { isPrimary: true } });
      }
    }

    return { success: true };
  }
}

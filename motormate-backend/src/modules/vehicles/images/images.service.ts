import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ImagesService {
  constructor(private readonly prisma: PrismaService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private uploadBuffer(buffer: Buffer): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: 'motormate/vehicles', resource_type: 'image' },
          (err, result) => (err ? reject(err) : resolve(result!)),
        )
        .end(buffer);
    });
  }

  private async assertOwner(vehicleId: string, userId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, userId, deletedAt: null },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return vehicle;
  }

  // ─── Upload images ───────────────────────────────────────────────────────────

  async uploadImages(
    vehicleId: string,
    userId: string,
    files: Express.Multer.File[],
  ) {
    await this.assertOwner(vehicleId, userId);

    const existing = await this.prisma.vehicleImage.count({
      where: { vehicleId },
    });

    if (existing + files.length > 10) {
      throw new BadRequestException(
        `Upload would exceed the 10-image limit. Currently ${existing} image(s) uploaded.`,
      );
    }

    const isFirstBatch = existing === 0;

    const uploaded = await Promise.all(
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

    return uploaded;
  }

  // ─── Set primary ─────────────────────────────────────────────────────────────

  async setPrimary(vehicleId: string, userId: string, imgId: string) {
    await this.assertOwner(vehicleId, userId);

    const image = await this.prisma.vehicleImage.findFirst({
      where: { id: imgId, vehicleId },
    });
    if (!image) throw new NotFoundException('Image not found');

    await this.prisma.$transaction([
      this.prisma.vehicleImage.updateMany({
        where: { vehicleId },
        data: { isPrimary: false },
      }),
      this.prisma.vehicleImage.update({
        where: { id: imgId },
        data: { isPrimary: true },
      }),
    ]);

    return { success: true };
  }

  // ─── Delete image ─────────────────────────────────────────────────────────────

  async deleteImage(vehicleId: string, userId: string, imgId: string) {
    await this.assertOwner(vehicleId, userId);

    const image = await this.prisma.vehicleImage.findFirst({
      where: { id: imgId, vehicleId },
    });
    if (!image) throw new NotFoundException('Image not found');

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(image.publicId);

    // Delete from DB
    await this.prisma.vehicleImage.delete({ where: { id: imgId } });

    // If deleted image was primary, promote the earliest remaining image
    if (image.isPrimary) {
      const next = await this.prisma.vehicleImage.findFirst({
        where: { vehicleId },
        orderBy: { createdAt: 'asc' },
      });
      if (next) {
        await this.prisma.vehicleImage.update({
          where: { id: next.id },
          data: { isPrimary: true },
        });
      }
    }

    return { success: true };
  }

  // ─── List images for a vehicle ───────────────────────────────────────────────

  async getImages(vehicleId: string, userId: string) {
    await this.assertOwner(vehicleId, userId);
    return this.prisma.vehicleImage.findMany({
      where: { vehicleId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as archiver from 'archiver';
import * as https from 'https';
import * as http from 'http';
import { Readable } from 'stream';
import { Response } from 'express';
import { DocumentType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { UploadDocumentDto } from './dto/upload-document.dto';

const MAX_DOCS = 20;

@Injectable()
export class DocumentsService {
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
            folder: 'motormate/documents',
            resource_type: 'auto',
            public_id: `${Date.now()}_${originalName.replace(/\.[^/.]+$/, '')}`,
            use_filename: false,
          },
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

  // ─── Upload documents ─────────────────────────────────────────────────────

  async uploadDocuments(
    vehicleId: string,
    userId: string,
    files: Express.Multer.File[],
    dto: UploadDocumentDto,
  ) {
    await this.assertOwner(vehicleId, userId);

    const existing = await this.prisma.vehicleDocument.count({
      where: { vehicleId },
    });

    if (existing + files.length > MAX_DOCS) {
      throw new BadRequestException(
        `Upload would exceed the ${MAX_DOCS}-document limit. Currently ${existing} uploaded.`,
      );
    }

    const uploaded = await Promise.all(
      files.map(async (file) => {
        const result = await this.uploadBuffer(file.buffer, file.originalname);
        return this.prisma.vehicleDocument.create({
          data: {
            vehicleId,
            name: file.originalname,
            url: result.secure_url,
            publicId: result.public_id,
            docType: dto.docType ?? DocumentType.OTHER,
            isLocked: false,
            expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
          },
        });
      }),
    );

    return uploaded;
  }

  // ─── List documents ───────────────────────────────────────────────────────

  async listDocuments(vehicleId: string, userId: string) {
    await this.assertOwner(vehicleId, userId);
    return this.prisma.vehicleDocument.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─── Signed download URL ──────────────────────────────────────────────────

  async getSignedUrl(vehicleId: string, userId: string, docId: string) {
    await this.assertOwner(vehicleId, userId);

    const doc = await this.prisma.vehicleDocument.findFirst({
      where: { id: docId, vehicleId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    const expiresAt = Math.floor(Date.now() / 1000) + 300; // 5 minutes
    const signedUrl = cloudinary.url(doc.publicId, {
      sign_url: true,
      type: 'upload',
      resource_type: 'auto',
      expires_at: expiresAt,
    });

    return { url: signedUrl, name: doc.name };
  }

  // ─── Delete document ──────────────────────────────────────────────────────

  async deleteDocument(vehicleId: string, userId: string, docId: string) {
    await this.assertOwner(vehicleId, userId);

    const doc = await this.prisma.vehicleDocument.findFirst({
      where: { id: docId, vehicleId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    if (doc.isLocked) {
      throw new ForbiddenException(
        'Document is locked — vehicle has been sold',
      );
    }

    await cloudinary.uploader.destroy(doc.publicId, {
      resource_type: 'auto',
    });

    await this.prisma.vehicleDocument.delete({ where: { id: docId } });

    return { success: true };
  }

  // ─── Download all as ZIP ──────────────────────────────────────────────────

  async downloadAll(vehicleId: string, userId: string, res: Response) {
    const vehicle = await this.assertOwner(vehicleId, userId);

    const docs = await this.prisma.vehicleDocument.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'asc' },
    });

    const date = new Date().toISOString().slice(0, 10);
    const plate = vehicle.plateNumber?.replace(/[^a-zA-Z0-9]/g, '_') ?? vehicle.id.slice(0, 8);
    const fileName = `${plate}_documents_${date}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const archive = archiver.default('zip', { zlib: { level: 6 } });
    archive.pipe(res);

    for (const doc of docs) {
      await new Promise<void>((resolve, reject) => {
        const urlObj = new URL(doc.url);
        const client = urlObj.protocol === 'https:' ? https : http;
        client
          .get(doc.url, (res) => {
            archive.append(res as unknown as Readable, {
              name: doc.name,
            });
            res.on('end', resolve);
            res.on('error', reject);
          })
          .on('error', reject);
      });
    }

    await archive.finalize();
  }

  // ─── Lock all documents (called on sell) ──────────────────────────────────

  async lockDocuments(vehicleId: string) {
    await this.prisma.vehicleDocument.updateMany({
      where: { vehicleId },
      data: { isLocked: true },
    });
  }
}

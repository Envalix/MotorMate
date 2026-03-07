import { DocumentType, PrismaClient } from '@prisma/client';
import { cloudinary } from '@/lib/cloudinary';
import { UploadApiResponse } from 'cloudinary';

const MAX_DOCS = 20;

interface FileInput {
  buffer: Buffer;
  originalname: string;
}

export class DocumentsService {
  constructor(private readonly prisma: PrismaClient) {}

  private uploadBuffer(buffer: Buffer, originalName: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'motormate/documents',
            resource_type: 'auto',
            public_id: `${Date.now()}_${originalName.replace(/\.[^/.]+$/, '')}`,
            use_filename: false,
          },
          (err, result) => (err ? reject(new Error(err.message)) : resolve(result!)),
        )
        .end(buffer);
    });
  }

  async assertOwner(vehicleId: string, userId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, userId, deletedAt: null },
    });
    if (!vehicle) throw new Error('NOT_FOUND:Vehicle not found');
    return vehicle;
  }

  async listDocuments(vehicleId: string, userId: string) {
    await this.assertOwner(vehicleId, userId);
    return this.prisma.vehicleDocument.findMany({
      where: { vehicleId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async uploadDocuments(
    vehicleId: string,
    userId: string,
    files: FileInput[],
    dto: { docType?: DocumentType; expiryDate?: string },
  ) {
    await this.assertOwner(vehicleId, userId);

    const existing = await this.prisma.vehicleDocument.count({ where: { vehicleId } });
    if (existing + files.length > MAX_DOCS) {
      throw new Error(`BAD_REQUEST:Upload would exceed the ${MAX_DOCS}-document limit. Currently ${existing} uploaded.`);
    }

    return Promise.all(
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
  }

  async getSignedUrl(vehicleId: string, userId: string, docId: string) {
    await this.assertOwner(vehicleId, userId);

    const doc = await this.prisma.vehicleDocument.findFirst({ where: { id: docId, vehicleId } });
    if (!doc) throw new Error('NOT_FOUND:Document not found');

    const expiresAt = Math.floor(Date.now() / 1000) + 300;
    const signedUrl = cloudinary.url(doc.publicId, {
      sign_url: true,
      type: 'upload',
      resource_type: 'auto',
      expires_at: expiresAt,
    });

    return { url: signedUrl, name: doc.name };
  }

  async deleteDocument(vehicleId: string, userId: string, docId: string) {
    await this.assertOwner(vehicleId, userId);

    const doc = await this.prisma.vehicleDocument.findFirst({ where: { id: docId, vehicleId } });
    if (!doc) throw new Error('NOT_FOUND:Document not found');
    if (doc.isLocked) throw new Error('FORBIDDEN:Document is locked — vehicle has been sold');

    await cloudinary.uploader.destroy(doc.publicId, { resource_type: 'auto' });
    await this.prisma.vehicleDocument.delete({ where: { id: docId } });

    return { success: true };
  }

  async lockDocuments(vehicleId: string) {
    await this.prisma.vehicleDocument.updateMany({
      where: { vehicleId },
      data: { isLocked: true },
    });
  }
}

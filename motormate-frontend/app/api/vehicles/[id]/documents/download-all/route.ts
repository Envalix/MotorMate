import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { prisma } from '@/lib/db';
import { cloudinary } from '@/lib/cloudinary';
import archiver from 'archiver';
import * as https from 'https';
import { Readable, PassThrough } from 'stream';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;

    const vehicle = await prisma.vehicle.findFirst({
      where: { id, userId: userId!, deletedAt: null },
    });
    if (!vehicle) {
      return NextResponse.json({ message: 'Vehicle not found' }, { status: 404 });
    }

    const docs = await prisma.vehicleDocument.findMany({
      where: { vehicleId: id },
      orderBy: { createdAt: 'asc' },
    });

    const plate = vehicle.plateNumber?.replace(/[^a-zA-Z0-9]/g, '_') ?? id.slice(0, 8);
    const date = new Date().toISOString().slice(0, 10);
    const fileName = `${plate}_documents_${date}.zip`;

    const passThrough = new PassThrough();
    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.pipe(passThrough);

    const webStream = Readable.toWeb(passThrough) as ReadableStream;

    (async () => {
      for (const doc of docs) {
        const expiresAt = Math.floor(Date.now() / 1000) + 300;
        const signedUrl = cloudinary.url(doc.publicId, {
          sign_url: true,
          type: 'upload',
          resource_type: 'auto',
          expires_at: expiresAt,
        });

        await new Promise<void>((resolve, reject) => {
          https
            .get(signedUrl, (stream) => {
              archive.append(stream as unknown as Readable, { name: doc.name });
              stream.on('end', resolve);
              stream.on('error', reject);
            })
            .on('error', reject);
        });
      }
      await archive.finalize();
    })();

    return new NextResponse(webStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

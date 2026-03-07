import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { ImagesService } from '@/services/images.service';
import { prisma } from '@/lib/db';

const svc = new ImagesService(prisma);

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const images = await svc.getImages(id, userId!);
    return NextResponse.json(images);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.startsWith('NOT_FOUND:')) return NextResponse.json({ message: msg.slice(10) }, { status: 404 });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files.length) {
      return NextResponse.json({ message: 'No files provided' }, { status: 400 });
    }

    const buffers = await Promise.all(
      files.map(async (f) => ({
        buffer: Buffer.from(await f.arrayBuffer()),
        originalname: f.name,
        mimetype: f.type,
        size: f.size,
      })),
    );

    const images = await svc.uploadImages(id, userId!, buffers);
    return NextResponse.json(images, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.startsWith('NOT_FOUND:')) return NextResponse.json({ message: msg.slice(10) }, { status: 404 });
    if (msg.startsWith('BAD_REQUEST:')) return NextResponse.json({ message: msg.slice(12) }, { status: 400 });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { ImagesService } from '@/services/images.service';
import { prisma } from '@/lib/db';

const svc = new ImagesService(prisma);

type Ctx = { params: Promise<{ id: string; imgId: string }> };

export async function PATCH(_req: NextRequest, { params }: Ctx) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const { id, imgId } = await params;
    const result = await svc.setPrimary(id, userId!, imgId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.startsWith('NOT_FOUND:')) return NextResponse.json({ message: msg.slice(10) }, { status: 404 });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

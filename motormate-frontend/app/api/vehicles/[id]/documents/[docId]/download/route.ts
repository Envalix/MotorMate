import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { DocumentsService } from '@/services/documents.service';
import { prisma } from '@/lib/db';

const svc = new DocumentsService(prisma);

type Ctx = { params: Promise<{ id: string; docId: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const { id, docId } = await params;
    const result = await svc.getSignedUrl(id, userId!, docId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.startsWith('NOT_FOUND:')) return NextResponse.json({ message: msg.slice(10) }, { status: 404 });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

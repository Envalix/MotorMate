import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { DocumentsService } from '@/services/documents.service';
import { prisma } from '@/lib/db';
import { DocumentType } from '@prisma/client';

const svc = new DocumentsService(prisma);

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const docs = await svc.listDocuments(id, userId!);
    return NextResponse.json(docs);
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
    const docType = formData.get('docType') as DocumentType | null;
    const expiryDate = formData.get('expiryDate') as string | null;

    if (!files.length) {
      return NextResponse.json({ message: 'No files provided' }, { status: 400 });
    }

    const buffers = await Promise.all(
      files.map(async (f) => ({
        buffer: Buffer.from(await f.arrayBuffer()),
        originalname: f.name,
      })),
    );

    const docs = await svc.uploadDocuments(id, userId!, buffers, {
      docType: docType ?? undefined,
      expiryDate: expiryDate ?? undefined,
    });
    return NextResponse.json(docs, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.startsWith('NOT_FOUND:')) return NextResponse.json({ message: msg.slice(10) }, { status: 404 });
    if (msg.startsWith('BAD_REQUEST:')) return NextResponse.json({ message: msg.slice(12) }, { status: 400 });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

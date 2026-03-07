import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { BuyRecordsService } from '@/services/buy-records.service';
import { prisma } from '@/lib/db';
import { serializeDecimals } from '@/lib/decimal';

const svc = new BuyRecordsService(prisma);

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const record = await svc.get(id, userId!);
    return NextResponse.json(serializeDecimals(record));
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
    const body = await req.json();
    const record = await svc.create(id, userId!, body);
    return NextResponse.json(serializeDecimals(record), { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.startsWith('NOT_FOUND:')) return NextResponse.json({ message: msg.slice(10) }, { status: 404 });
    if (msg.startsWith('BAD_REQUEST:')) return NextResponse.json({ message: msg.slice(12) }, { status: 400 });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

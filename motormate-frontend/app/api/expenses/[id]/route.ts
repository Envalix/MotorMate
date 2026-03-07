import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { ExpensesService } from '@/services/expenses.service';
import { prisma } from '@/lib/db';
import { serializeDecimals } from '@/lib/decimal';
import { ExpenseCategory } from '@prisma/client';

const svc = new ExpensesService(prisma);

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const contentType = req.headers.get('content-type') ?? '';

    let dto: { category?: ExpenseCategory; description?: string; amount?: string; date?: string; vendor?: string } = {};
    let file: { buffer: Buffer; originalname: string } | undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      if (formData.get('category')) dto.category = formData.get('category') as ExpenseCategory;
      if (formData.get('description')) dto.description = formData.get('description') as string;
      if (formData.get('amount')) dto.amount = formData.get('amount') as string;
      if (formData.get('date')) dto.date = formData.get('date') as string;
      if (formData.get('vendor')) dto.vendor = formData.get('vendor') as string;
      const f = formData.get('receipt') as File | null;
      if (f) {
        file = { buffer: Buffer.from(await f.arrayBuffer()), originalname: f.name };
      }
    } else {
      dto = await req.json();
    }

    const expense = await svc.update(id, userId!, dto, file);
    return NextResponse.json(serializeDecimals(expense));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.startsWith('NOT_FOUND:')) return NextResponse.json({ message: msg.slice(10) }, { status: 404 });
    if (msg.startsWith('FORBIDDEN:')) return NextResponse.json({ message: msg.slice(10) }, { status: 403 });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const result = await svc.remove(id, userId!);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.startsWith('NOT_FOUND:')) return NextResponse.json({ message: msg.slice(10) }, { status: 404 });
    if (msg.startsWith('FORBIDDEN:')) return NextResponse.json({ message: msg.slice(10) }, { status: 403 });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

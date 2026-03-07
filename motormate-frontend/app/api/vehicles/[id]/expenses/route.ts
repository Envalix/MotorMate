import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { ExpensesService } from '@/services/expenses.service';
import { prisma } from '@/lib/db';
import { serializeDecimals } from '@/lib/decimal';
import { ExpenseCategory } from '@prisma/client';

const svc = new ExpensesService(prisma);

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const { id } = await params;
    const result = await svc.list(id, userId!);
    return NextResponse.json(serializeDecimals(result));
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
    const contentType = req.headers.get('content-type') ?? '';

    let dto: { category: ExpenseCategory; description: string; amount: string; date: string; vendor?: string };
    let file: { buffer: Buffer; originalname: string } | undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      dto = {
        category: formData.get('category') as ExpenseCategory,
        description: formData.get('description') as string,
        amount: formData.get('amount') as string,
        date: formData.get('date') as string,
        vendor: (formData.get('vendor') as string) || undefined,
      };
      const f = formData.get('receipt') as File | null;
      if (f) {
        file = { buffer: Buffer.from(await f.arrayBuffer()), originalname: f.name };
      }
    } else {
      dto = await req.json();
    }

    const expense = await svc.create(id, userId!, dto, file);
    return NextResponse.json(serializeDecimals(expense), { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.startsWith('NOT_FOUND:')) return NextResponse.json({ message: msg.slice(10) }, { status: 404 });
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

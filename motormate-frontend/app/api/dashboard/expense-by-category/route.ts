import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { DashboardService } from '@/services/dashboard.service';
import { prisma } from '@/lib/db';

const svc = new DashboardService(prisma);

export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const data = await svc.getExpenseByCategory(userId!);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

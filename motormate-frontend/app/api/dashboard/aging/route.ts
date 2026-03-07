import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { DashboardService } from '@/services/dashboard.service';
import { prisma } from '@/lib/db';

const svc = new DashboardService(prisma);

export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const aging = await svc.getAging(userId!);
    return NextResponse.json(aging);
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

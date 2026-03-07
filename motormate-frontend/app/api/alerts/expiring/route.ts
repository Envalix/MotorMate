import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { AlertsService } from '@/services/alerts.service';
import { prisma } from '@/lib/db';

const svc = new AlertsService(prisma);

export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const alerts = await svc.getExpiringDocuments(userId!);
    return NextResponse.json(alerts);
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

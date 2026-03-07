import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import { VehiclesService } from '@/services/vehicles.service';
import { prisma } from '@/lib/db';
import { serializeDecimals } from '@/lib/decimal';
import { VehicleStatus } from '@prisma/client';

const svc = new VehiclesService(prisma);

export async function GET(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as VehicleStatus | null;
  const search = searchParams.get('search') ?? undefined;

  const vehicles = await svc.findAll(userId!, {
    status: status ?? undefined,
    search,
  });
  return NextResponse.json(serializeDecimals(vehicles));
}

export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  try {
    const body = await req.json();
    const vehicle = await svc.create(userId!, body);
    return NextResponse.json(serializeDecimals(vehicle), { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    if (msg.includes('Unique constraint')) {
      return NextResponse.json({ message: 'VIN or plate number already in use' }, { status: 409 });
    }
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}

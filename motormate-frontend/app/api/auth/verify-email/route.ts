import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'node:crypto';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ message: 'Token is required' }, { status: 400 });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await prisma.user.findUnique({ where: { emailVerifyToken: hashedToken } });

    if (!user?.emailVerifyExpiry || user.emailVerifyExpiry < new Date()) {
      return NextResponse.json(
        { message: 'Verification link is invalid or has expired' },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerifyToken: null, emailVerifyExpiry: null },
    });

    return NextResponse.json({ message: 'Email verified successfully' });
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

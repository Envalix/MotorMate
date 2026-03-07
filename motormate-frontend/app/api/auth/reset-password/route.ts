import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ message: 'Token and password are required' }, { status: 400 });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await prisma.user.findUnique({ where: { passwordResetToken: hashedToken } });

    if (!user?.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      return NextResponse.json({ message: 'Reset token is invalid or has expired' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, passwordResetToken: null, passwordResetExpiry: null },
    });

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

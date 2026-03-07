import { PrismaClient } from '@prisma/client';

export class UsersService {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByGoogleId(googleId: string) {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  create(data: {
    email: string;
    name: string;
    password?: string;
    googleId?: string;
    avatarUrl?: string;
    authProvider?: 'EMAIL' | 'GOOGLE';
    isEmailVerified?: boolean;
  }) {
    return this.prisma.user.create({ data });
  }

  update(id: string, data: { googleId?: string; avatarUrl?: string }) {
    return this.prisma.user.update({ where: { id }, data });
  }

  setPasswordResetToken(userId: string, hashedToken: string, expiry: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordResetToken: hashedToken, passwordResetExpiry: expiry },
    });
  }

  findByPasswordResetToken(hashedToken: string) {
    return this.prisma.user.findUnique({ where: { passwordResetToken: hashedToken } });
  }

  updatePassword(userId: string, hashedPassword: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, passwordResetToken: null, passwordResetExpiry: null },
    });
  }

  setEmailVerifyToken(userId: string, hashedToken: string, expiry: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifyToken: hashedToken, emailVerifyExpiry: expiry },
    });
  }

  findByEmailVerifyToken(hashedToken: string) {
    return this.prisma.user.findUnique({ where: { emailVerifyToken: hashedToken } });
  }

  markEmailVerified(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true, emailVerifyToken: null, emailVerifyExpiry: null },
    });
  }
}

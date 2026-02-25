import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  password: string | null;
  googleId: string | null;
  avatarUrl: string | null;
  authProvider: string;
  passwordResetToken: string | null;
  passwordResetExpiry: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({
      where: { id },
    }) as Promise<UserRecord | null>;
  }

  findByEmail(email: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({
      where: { email },
    }) as Promise<UserRecord | null>;
  }

  findByGoogleId(googleId: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({
      where: { googleId },
    }) as Promise<UserRecord | null>;
  }

  create(data: {
    email: string;
    name: string;
    password?: string;
    googleId?: string;
    avatarUrl?: string;
    authProvider?: 'EMAIL' | 'GOOGLE';
  }): Promise<UserRecord> {
    return this.prisma.user.create({ data }) as Promise<UserRecord>;
  }

  update(
    id: string,
    data: { googleId?: string; avatarUrl?: string },
  ): Promise<UserRecord> {
    return this.prisma.user.update({
      where: { id },
      data,
    }) as Promise<UserRecord>;
  }

  setPasswordResetToken(
    userId: string,
    hashedToken: string,
    expiry: Date,
  ): Promise<UserRecord> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordResetToken: hashedToken, passwordResetExpiry: expiry },
    }) as Promise<UserRecord>;
  }

  findByPasswordResetToken(hashedToken: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({
      where: { passwordResetToken: hashedToken },
    }) as Promise<UserRecord | null>;
  }

  updatePassword(userId: string, hashedPassword: string): Promise<UserRecord> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    }) as Promise<UserRecord>;
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';

interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  // ─── Local (email/password) ───────────────────────────────────────────────

  async validateLocalUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user?.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email address before logging in',
      );
    }
    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  async register(dto: RegisterDto, frontendUrl: string) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.create({
      email: dto.email,
      name: dto.name,
      password: hashed,
      authProvider: 'EMAIL',
    });

    // Generate verification token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.usersService.setEmailVerifyToken(user.id, hashedToken, expiry);

    // Send verification email (non-blocking — failure won't break registration)
    this.mailService
      .sendVerificationEmail(
        user.email,
        user.name,
        `${frontendUrl}/verify-email?token=${rawToken}`,
      )
      .catch(() => {});

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  async verifyEmail(rawToken: string): Promise<void> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const user = await this.usersService.findByEmailVerifyToken(hashedToken);

    if (!user?.emailVerifyExpiry || user.emailVerifyExpiry < new Date()) {
      throw new BadRequestException(
        'Verification link is invalid or has expired',
      );
    }

    await this.usersService.markEmailVerified(user.id);
  }

  // ─── Google OAuth ─────────────────────────────────────────────────────────

  async validateGoogleUser(profile: GoogleProfile) {
    // 1. Already linked to this Google ID?
    let user = await this.usersService.findByGoogleId(profile.googleId);
    if (user) {
      const { password: _, ...safeUser } = user;
      return safeUser;
    }

    // 2. Email exists — link Google to the existing account
    const byEmail = await this.usersService.findByEmail(profile.email);
    if (byEmail) {
      user = await this.usersService.update(byEmail.id, {
        googleId: profile.googleId,
        avatarUrl: byEmail.avatarUrl ?? profile.avatarUrl,
      });
      const { password: _, ...safeUser } = user;
      return safeUser;
    }

    // 3. Brand-new user — create from Google profile (auto-verified via Google)
    const created = await this.usersService.create({
      email: profile.email,
      name: profile.name,
      googleId: profile.googleId,
      avatarUrl: profile.avatarUrl,
      authProvider: 'GOOGLE',
      isEmailVerified: true,
    });
    const { password: _, ...safeUser } = created;
    return safeUser;
  }

  // ─── Password reset ───────────────────────────────────────────────────────

  async forgotPassword(email: string, frontendUrl: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    // Always return success to prevent email enumeration
    if (!user?.authProvider || user.authProvider !== 'EMAIL') return;

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.usersService.setPasswordResetToken(user.id, hashedToken, expiry);
    await this.mailService.sendPasswordResetEmail(
      user.email,
      user.name,
      `${frontendUrl}/reset-password?token=${rawToken}`,
    );
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const user = await this.usersService.findByPasswordResetToken(hashedToken);

    if (!user?.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      throw new BadRequestException('Reset token is invalid or has expired');
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await this.usersService.updatePassword(user.id, hashed);
  }

  // ─── JWT issuance ─────────────────────────────────────────────────────────

  login(user: AuthUserPayload) {
    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: AuthUserPayload) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl ?? null,
      },
    };
  }
}

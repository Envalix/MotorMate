import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GoogleAuthGuard } from '../../guards/google-auth.guard';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { LocalAuthGuard } from '../../guards/local-auth.guard';
import { AuthService, AuthUserPayload } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * POST /api/auth/register
   * Create a new local (email/password) account and send a verification email.
   * Returns a message — no JWT yet (account must be verified first).
   */
  @Post('register')
  register(@Body() dto: RegisterDto) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    return this.authService.register(dto, frontendUrl);
  }

  /**
   * GET /api/auth/verify-email?token=<raw-token>
   * Validates the token and marks the account as verified.
   */
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    await this.authService.verifyEmail(token);
    return { message: 'Email verified successfully. You can now log in.' };
  }

  /**
   * POST /api/auth/login
   * LocalAuthGuard triggers LocalStrategy which validates email + password.
   * On success, passport sets req.user to the validated (password-stripped) user.
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Req() req: Request) {
    return this.authService.login(req.user as AuthUserPayload);
  }

  /**
   * GET /api/auth/google
   * Redirects the browser to Google's OAuth consent screen.
   */
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleAuth() {
    // Guard handles the redirect — no body needed here
  }

  /**
   * GET /api/auth/google/callback
   * Google redirects here after consent. GoogleStrategy validates the profile,
   * finds or creates the user, then we issue a JWT and redirect to the frontend.
   */
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  googleCallback(@Req() req: Request, @Res() res: Response) {
    const { accessToken } = this.authService.login(req.user as AuthUserPayload);
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
  }

  /**
   * POST /api/auth/forgot-password
   * Generates a signed reset token, stores its hash in DB, sends email.
   * Always returns 200 so callers cannot determine whether the email exists.
   */
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    await this.authService.forgotPassword(dto.email, frontendUrl);
    return {
      message:
        'If that email is registered you will receive a reset link shortly.',
    };
  }

  /**
   * POST /api/auth/reset-password
   * Validates the raw token, hashes the new password, clears the token.
   */
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { message: 'Password updated successfully.' };
  }

  /**
   * GET /api/auth/me
   * Returns the currently authenticated user (requires valid Bearer token).
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser() user: unknown) {
    return user;
  }
}

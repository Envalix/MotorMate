import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const host = config.getOrThrow<string>('SMTP_HOST');
    const port = config.get<number>('SMTP_PORT', 587);
    const user = config.getOrThrow<string>('SMTP_USER');
    const pass = config.getOrThrow<string>('SMTP_PASS');
    const fromEmail = config.getOrThrow<string>('SMTP_FROM_EMAIL');
    const fromName = config.get<string>('SMTP_FROM_NAME', 'MotorMate');

    this.from = `"${fromName}" <${fromEmail}>`;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    verifyUrl: string,
  ): Promise<void> {
    this.logger.log(`Sending verification email → ${to}`);
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: 'Verify your MotorMate email address',
        text: [
          `Hi ${name},`,
          '',
          'Thanks for signing up! Please verify your email address by opening the link below.',
          'The link expires in 24 hours.',
          '',
          verifyUrl,
          '',
          'If you did not create a MotorMate account, you can safely ignore this email.',
          '',
          '— The MotorMate team',
        ].join('\n'),
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#18181b">
            <h2 style="margin-bottom:4px">Verify your email address</h2>
            <p style="color:#71717a;margin-top:0">Hi ${name},</p>
            <p>Thanks for signing up for MotorMate! Click the button below to verify your email address. The link expires in <strong>24 hours</strong>.</p>
            <a href="${verifyUrl}"
               style="display:inline-block;margin:16px 0;padding:12px 24px;background:#18181b;color:#fff;border-radius:8px;text-decoration:none;font-weight:500">
              Verify email
            </a>
            <p style="color:#a1a1aa;font-size:13px">
              Or copy this URL into your browser:<br>
              <a href="${verifyUrl}" style="color:#52525b;word-break:break-all">${verifyUrl}</a>
            </p>
            <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0">
            <p style="color:#a1a1aa;font-size:12px">
              If you didn't create a MotorMate account you can safely ignore this email.
            </p>
          </div>
        `,
      });
      this.logger.log(`Verification email sent → ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send verification email → ${to}`, err);
      throw err;
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    this.logger.log(`Sending welcome email → ${to}`);
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: 'Welcome to MotorMate!',
        text: [
          `Hi ${name},`,
          '',
          'Welcome to MotorMate — your personal vehicle management hub.',
          '',
          'You can now track your vehicles, manage documents, log expenses, and more.',
          '',
          '— The MotorMate team',
        ].join('\n'),
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#18181b">
            <h2 style="margin-bottom:4px">Welcome to MotorMate!</h2>
            <p style="color:#71717a;margin-top:0">Hi ${name},</p>
            <p>Your account is ready. Here's what you can do with MotorMate:</p>
            <ul style="padding-left:20px;line-height:1.8">
              <li>Track and manage your vehicles</li>
              <li>Store documents and images</li>
              <li>Log expenses and service records</li>
              <li>Monitor buy &amp; sell history</li>
            </ul>
            <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0">
            <p style="color:#a1a1aa;font-size:12px">
              You received this email because you created a MotorMate account.
            </p>
          </div>
        `,
      });
      this.logger.log(`Welcome email sent → ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send welcome email → ${to}`, err);
      throw err;
    }
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetUrl: string,
  ): Promise<void> {
    this.logger.log(`Sending password reset email → ${to}`);
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: 'Reset your MotorMate password',
        text: [
          `Hi ${name},`,
          '',
          'We received a request to reset your password.',
          'Open the link below within 1 hour to set a new password:',
          '',
          resetUrl,
          '',
          'If you did not request this, you can safely ignore this email.',
          '',
          '— The MotorMate team',
        ].join('\n'),
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#18181b">
            <h2 style="margin-bottom:4px">Reset your password</h2>
            <p style="color:#71717a;margin-top:0">Hi ${name},</p>
            <p>We received a request to reset your MotorMate password. Click the button below — the link expires in <strong>1 hour</strong>.</p>
            <a href="${resetUrl}"
               style="display:inline-block;margin:16px 0;padding:12px 24px;background:#18181b;color:#fff;border-radius:8px;text-decoration:none;font-weight:500">
              Reset password
            </a>
            <p style="color:#a1a1aa;font-size:13px">
              Or copy this URL into your browser:<br>
              <a href="${resetUrl}" style="color:#52525b;word-break:break-all">${resetUrl}</a>
            </p>
            <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0">
            <p style="color:#a1a1aa;font-size:12px">
              If you didn't request a password reset you can safely ignore this email.
            </p>
          </div>
        `,
      });
      this.logger.log(`Password reset email sent → ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send password reset email → ${to}`, err);
      throw err;
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly from: { email: string; name: string };

  constructor(private readonly config: ConfigService) {
    sgMail.setApiKey(config.getOrThrow<string>('SENDGRID_API_KEY'));
    this.from = {
      email: config.getOrThrow<string>('SENDGRID_FROM_EMAIL'),
      name: config.get<string>('SENDGRID_FROM_NAME', 'MotorMate'),
    };
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    resetUrl: string,
  ): Promise<void> {
    const msg: sgMail.MailDataRequired = {
      to,
      from: this.from,
      subject: 'Reset your MotorMate password',
      text: [
        `Hi ${name},`,
        '',
        'We received a request to reset your password.',
        `Open the link below within 1 hour to set a new password:`,
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
    };

    try {
      await sgMail.send(msg);
    } catch (err) {
      this.logger.error('Failed to send password reset email', err);
      throw err;
    }
  }
}

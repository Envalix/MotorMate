import nodemailer, { Transporter } from 'nodemailer';

let _transporter: Transporter | null = null;
let _from: string = '';

function getTransporter(): { transporter: Transporter; from: string } {
  if (_transporter) return { transporter: _transporter, from: _from };

  const host = process.env.SMTP_HOST!;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER!;
  const pass = process.env.SMTP_PASS!;
  const fromEmail = process.env.SMTP_FROM_EMAIL!;
  const fromName = process.env.SMTP_FROM_NAME ?? 'MotorMate';

  _from = `"${fromName}" <${fromEmail}>`;
  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return { transporter: _transporter, from: _from };
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  verifyUrl: string,
): Promise<void> {
  const { transporter, from } = getTransporter();
  await transporter.sendMail({
    from,
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
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string,
): Promise<void> {
  const { transporter, from } = getTransporter();
  await transporter.sendMail({
    from,
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
}

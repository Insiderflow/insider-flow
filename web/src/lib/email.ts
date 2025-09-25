import fetch from 'node-fetch';

const GRIDSEND_API_KEY = process.env.GRIDSEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
const DISABLE_EMAIL = process.env.DISABLE_EMAIL === 'true';

type EmailResponse = { ok: true } | Record<string, unknown>;

export async function sendEmail(to: string, subject: string, html: string): Promise<EmailResponse> {
  // No-op in development or when disabled/missing config
  if (DISABLE_EMAIL || process.env.NODE_ENV !== 'production' || !GRIDSEND_API_KEY || !EMAIL_FROM) {
    console.log('[email noop]', { to, subject });
    return { ok: true };
  }
  const response = await fetch('https://api.gridsend.com/v1/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GRIDSEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  const json = (await response.json()) as Record<string, unknown>;
  return json;
}

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify?token=${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Verify Your Email</h2>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
        Verify Email
      </a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
    </div>
  `;

  return sendEmail(email, 'Verify Your Email - Insider Flow', html);
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset Your Password</h2>
      <p>You requested to reset your password. Click the link below to set a new password:</p>
      <a href="${resetUrl}" style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
        Reset Password
      </a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${resetUrl}</p>
      <p><small>This link will expire in 1 hour.</small></p>
    </div>
  `;

  return sendEmail(email, 'Reset Your Password - Insider Flow', html);
}

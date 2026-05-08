import fetch from 'node-fetch';
import { getPublicAppUrlOrDefault } from '@/lib/publicAppUrl';
import crypto from 'crypto';

const GRIDSEND_API_KEY = process.env.GRIDSEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
const DISABLE_EMAIL = process.env.DISABLE_EMAIL === 'true';

type EmailResponse = { ok: true } | Record<string, unknown>;

export async function sendEmail(to: string, subject: string, html: string): Promise<EmailResponse> {
  // Check configuration
  if (DISABLE_EMAIL) {
    console.warn('[email disabled] DISABLE_EMAIL is set to true', { to, subject });
    throw new Error('Email sending is disabled');
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn('[email skipped] Not in production mode', { to, subject, nodeEnv: process.env.NODE_ENV });
    // In development, log but don't throw - allow testing
    return { ok: true, skipped: true, reason: 'development' };
  }

  if (!GRIDSEND_API_KEY) {
    console.error('[email error] GRIDSEND_API_KEY is missing', { to, subject });
    throw new Error('GRIDSEND_API_KEY is not configured');
  }

  if (!EMAIL_FROM) {
    console.error('[email error] EMAIL_FROM is missing', { to, subject });
    throw new Error('EMAIL_FROM is not configured');
  }

  try {
    console.log('[email sending]', { to, subject, from: EMAIL_FROM });
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
      const errorText = await response.text();
      console.error('[email error] GridSend API error', { 
        status: response.status, 
        statusText: response.statusText,
        error: errorText,
        to,
        subject
      });
      throw new Error(`Failed to send email: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const json = (await response.json()) as Record<string, unknown>;
    console.log('[email sent]', { to, subject, response: json });
    return json;
  } catch (error) {
    console.error('[email exception]', { 
      error: error instanceof Error ? error.message : String(error),
      to,
      subject
    });
    throw error;
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${getPublicAppUrlOrDefault()}/api/verify-email?token=${token}`;
  
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

function signUnsubscribeToken(payload: string) {
  const secret = process.env.SESSION_SECRET || 'development-unsubscribe-secret';
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export function createUnsubscribeLink(userId: string, settingKey: 'watchlistUpdates') {
  const payload = `${userId}:${settingKey}`;
  const sig = signUnsubscribeToken(payload);
  return `${getPublicAppUrlOrDefault()}/api/unsubscribe?u=${encodeURIComponent(userId)}&k=${encodeURIComponent(settingKey)}&sig=${encodeURIComponent(sig)}`;
}

export function verifyUnsubscribeSignature(userId: string, settingKey: string, sig: string) {
  const payload = `${userId}:${settingKey}`;
  return signUnsubscribeToken(payload) === sig;
}

export async function sendWatchlistTradeEmail(params: {
  to: string;
  politicianName: string;
  politicianId: string;
  issuerName: string;
  tradeType: string;
  tradedAt: Date;
  sizeText: string;
  unsubscribeLink: string;
}) {
  const politicianUrl = `${getPublicAppUrlOrDefault()}/politicians/${params.politicianId}`;
  const subject = `${params.politicianName} 議員有新交易！`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #111827;">
      <h2 style="margin: 0 0 12px;">${params.politicianName} 議員有新交易！</h2>
      <p style="margin: 0 0 16px; color: #4b5563;">你追蹤的議員剛新增一筆申報交易。</p>
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; margin-bottom: 16px;">
        <p style="margin: 0 0 8px;"><strong>交易類型：</strong>${params.tradeType.toUpperCase()}</p>
        <p style="margin: 0 0 8px;"><strong>發行商：</strong>${params.issuerName}</p>
        <p style="margin: 0 0 8px;"><strong>金額區間：</strong>${params.sizeText}</p>
        <p style="margin: 0;"><strong>交易日期：</strong>${params.tradedAt.toLocaleDateString('zh-TW')}</p>
      </div>
      <p style="margin: 0 0 20px;">
        <a href="${politicianUrl}" style="display: inline-block; background: #2563eb; color: #fff; text-decoration: none; padding: 10px 14px; border-radius: 8px; font-weight: 600;">
          查看議員頁面
        </a>
      </p>
      <p style="font-size: 12px; color: #6b7280; margin: 0;">
        不想再收到這類通知？<a href="${params.unsubscribeLink}" style="color: #2563eb;">取消訂閱 watchlist 通知</a>
      </p>
    </div>
  `;
  return sendEmail(params.to, subject, html);
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${getPublicAppUrlOrDefault()}/reset-password?token=${token}`;
  
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

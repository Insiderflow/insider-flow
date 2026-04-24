#!/usr/bin/env node

/**
 * Script to send verification and password reset emails to a user
 * Usage: node scripts/send-user-emails.js <email>
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

// Use https module directly for fetch
const https = require('https');
const { URL } = require('url');

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const req = https.request({
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          json: () => Promise.resolve(JSON.parse(data)),
          text: () => Promise.resolve(data),
        });
      });
    });
    
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

const prisma = new PrismaClient();

// Email sending function (using GridSend like the main email.ts)
async function sendEmail(to, subject, html) {
  const GRIDSEND_API_KEY = process.env.GRIDSEND_API_KEY;
  const EMAIL_FROM = process.env.EMAIL_FROM || 'team@insiderflow.asia';
  const DISABLE_EMAIL = process.env.DISABLE_EMAIL === 'true';
  const NODE_ENV = process.env.NODE_ENV || 'development';

  if (DISABLE_EMAIL) {
    throw new Error('Email sending is disabled');
  }

  if (NODE_ENV !== 'production') {
    console.log(`[TEST MODE] Would send email in production:`);
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);
    return { ok: true, skipped: true };
  }

  if (!GRIDSEND_API_KEY) {
    throw new Error('GRIDSEND_API_KEY is not configured');
  }

  if (!EMAIL_FROM) {
    throw new Error('EMAIL_FROM is not configured');
  }

  console.log(`[Sending email] To: ${to}, Subject: ${subject}`);
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
    throw new Error(`Failed to send email: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const json = await response.json();
  console.log(`[Email sent] Response:`, json);
  return json;
}

async function sendVerificationEmail(email, token) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://insiderflow.asia';
  const verificationUrl = `${baseUrl}/api/auth/verify?token=${token}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Verify Your Email</h2>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
        Verify Email
      </a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
      <p><small>This link will expire in 1 hour.</small></p>
    </div>
  `;

  return sendEmail(email, 'Verify Your Email - Insider Flow', html);
}

async function sendPasswordResetEmail(email, token) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://insiderflow.asia';
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  
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

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: node scripts/send-user-emails.js <email>');
    process.exit(1);
  }

  console.log('🔍 Checking user account...\n');

  // Check environment
  console.log('📋 Environment Check:');
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`  GRIDSEND_API_KEY: ${process.env.GRIDSEND_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`  EMAIL_FROM: ${process.env.EMAIL_FROM || '❌ Missing'}`);
  console.log(`  NEXT_PUBLIC_BASE_URL: ${process.env.NEXT_PUBLIC_BASE_URL || 'not set'}\n`);

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      email_verified: true,
      password_hash: { select: true },
      email_verification_token: true,
      password_reset_token: true,
      password_reset_expires: true,
      created_at: true
    }
  });

  if (!user) {
    console.error(`❌ User with email ${email} not found in database`);
    process.exit(1);
  }

  console.log(`✅ User found:`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Email Verified: ${user.email_verified ? 'Yes ✅' : 'No ❌'}`);
  console.log(`   Has Password: ${user.password_hash ? 'Yes' : 'No (OAuth user)'}`);
  console.log(`   Account Created: ${user.created_at}\n`);

  // Send verification email if not verified
  if (!user.email_verified) {
    console.log('📧 Sending verification email...');
    try {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      await prisma.user.update({
        where: { id: user.id },
        data: { email_verification_token: verificationToken }
      });

      await sendVerificationEmail(email, verificationToken);
      console.log('✅ Verification email sent successfully!\n');
    } catch (error) {
      console.error('❌ Failed to send verification email:');
      console.error(`   ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    console.log('ℹ️  Email already verified, skipping verification email\n');
  }

  // Send password reset email if user has a password
  if (user.password_hash) {
    console.log('🔑 Sending password reset email...');
    try {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password_reset_token: resetToken,
          password_reset_expires: expiresAt
        }
      });

      await sendPasswordResetEmail(email, resetToken);
      console.log('✅ Password reset email sent successfully!\n');
    } catch (error) {
      console.error('❌ Failed to send password reset email:');
      console.error(`   ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    console.log('ℹ️  User has no password (OAuth user), skipping password reset email\n');
  }

  console.log('📝 Summary:');
  console.log(`   - Check the inbox and spam folder for: ${email}`);
  if (!user.email_verified) {
    console.log(`   - Verification link: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://insiderflow.asia'}/api/auth/verify?token=<token>`);
  }
  if (user.password_hash) {
    console.log(`   - Password reset link: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://insiderflow.asia'}/reset-password?token=<token>`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

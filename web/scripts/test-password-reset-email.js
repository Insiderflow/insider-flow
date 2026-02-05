#!/usr/bin/env node

/**
 * Test script to verify password reset email functionality
 * Usage: node scripts/test-password-reset-email.js <email>
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

// Import email function directly (since it's TypeScript, we'll replicate the logic)
async function sendPasswordResetEmail(email, token) {
  const fetch = require('node-fetch');
  const GRIDSEND_API_KEY = process.env.GRIDSEND_API_KEY;
  const EMAIL_FROM = process.env.EMAIL_FROM;
  const DISABLE_EMAIL = process.env.DISABLE_EMAIL === 'true';
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://insiderflow.asia'}/reset-password?token=${token}`;
  
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

  if (DISABLE_EMAIL) {
    throw new Error('Email sending is disabled');
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[TEST MODE] Would send email in production');
    return { ok: true, skipped: true };
  }

  if (!GRIDSEND_API_KEY) {
    throw new Error('GRIDSEND_API_KEY is not configured');
  }

  if (!EMAIL_FROM) {
    throw new Error('EMAIL_FROM is not configured');
  }

  const response = await fetch('https://api.gridsend.com/v1/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GRIDSEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: email,
      subject: 'Reset Your Password - Insider Flow',
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send email: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

const prisma = new PrismaClient();

async function testPasswordResetEmail() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: node scripts/test-password-reset-email.js <email>');
    process.exit(1);
  }

  console.log('🧪 Testing password reset email...\n');

  // Check environment variables
  console.log('📋 Environment Check:');
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`  GRIDSEND_API_KEY: ${process.env.GRIDSEND_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`  EMAIL_FROM: ${process.env.EMAIL_FROM || '❌ Missing'}`);
  console.log(`  DISABLE_EMAIL: ${process.env.DISABLE_EMAIL || 'not set'}`);
  console.log(`  NEXT_PUBLIC_BASE_URL: ${process.env.NEXT_PUBLIC_BASE_URL || 'not set'}\n`);

  // Check if user exists
  console.log('👤 Checking user...');
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password_hash: { select: true },
      email_verified: true
    }
  });

  if (!user) {
    console.error(`❌ User with email ${email} not found`);
    process.exit(1);
  }

  console.log(`  ✅ User found: ${user.email}`);
  console.log(`  Has password: ${user.password_hash ? 'Yes' : 'No (OAuth user)'}`);
  console.log(`  Email verified: ${user.email_verified ? 'Yes' : 'No'}\n`);

  if (!user.password_hash) {
    console.error('❌ User has no password (OAuth user). Password reset not applicable.');
    process.exit(1);
  }

  // Generate a test token
  const testToken = 'test-token-' + Date.now();
  console.log(`🔑 Generated test token: ${testToken}\n`);

  // Try to send email
  console.log('📧 Attempting to send password reset email...');
  try {
    await sendPasswordResetEmail(email, testToken);
    console.log('✅ Email sent successfully!\n');
    console.log('📝 Check the email inbox and spam folder for the reset link.');
    console.log(`   Reset URL should be: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://insiderflow.asia'}/reset-password?token=${testToken}`);
  } catch (error) {
    console.error('❌ Failed to send email:');
    console.error(`   ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testPasswordResetEmail().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

#!/usr/bin/env node

/**
 * Generate password reset token and link for a user
 * Usage: node scripts/generate-reset-link.js <email>
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: node scripts/generate-reset-link.js <email>');
    process.exit(1);
  }

  console.log('🔍 Looking up user...\n');

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      email_verified: true,
      password_hash: { select: true },
      created_at: true
    }
  });

  if (!user) {
    console.error(`❌ User with email ${email} not found`);
    process.exit(1);
  }

  console.log(`✅ User found:`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Email Verified: ${user.email_verified ? 'Yes ✅' : 'No ❌'}`);
  console.log(`   Has Password: ${user.password_hash ? 'Yes' : 'No (OAuth user)'}\n`);

  if (!user.password_hash) {
    console.error('❌ User has no password (OAuth user). Password reset not applicable.');
    process.exit(1);
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Update database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password_reset_token: resetToken,
      password_reset_expires: expiresAt,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://insiderflow.asia';
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  console.log('✅ Password reset token generated and saved to database\n');
  console.log('📧 Send this link to the user:');
  console.log(`\n${resetUrl}\n`);
  console.log('⏰ This link will expire in 1 hour');
  console.log(`\n📝 Token: ${resetToken}`);
  console.log(`   Expires: ${expiresAt.toISOString()}\n`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

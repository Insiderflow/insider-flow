#!/usr/bin/env node

// Test the actual registration email flow
require('dotenv').config({ path: '.env.local' });
const sgMail = require('@sendgrid/mail');

const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL;
const baseUrl = process.env.NEXTAUTH_URL || 'https://insiderflow.asia';

if (!apiKey) {
  console.error('❌ SENDGRID_API_KEY not found');
  process.exit(1);
}

sgMail.setApiKey(apiKey);

// Test email address
const testEmail = process.argv[2] || 'hiukiny@gmail.com';
const testToken = 'test-verification-token-123';

console.log('🧪 Testing Registration Email Flow\n');
console.log(`Sending verification email to: ${testEmail}`);
console.log(`From: ${fromEmail}`);
console.log(`Base URL: ${baseUrl}\n`);

const verificationUrl = `${baseUrl}/api/auth/verify?token=${testToken}`;

const msg = {
  to: testEmail,
  from: fromEmail,
  subject: 'Verify your email - Insider Flow',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; text-align: center;">Welcome to Insider Flow</h2>
      <p style="color: #666; font-size: 16px;">Please verify your email address to complete your registration.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" 
           style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          Verify Email Address
        </a>
      </div>
      <p style="color: #999; font-size: 14px; text-align: center;">
        This link will expire in 1 hour. If you didn't create an account, you can safely ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">
        Insider Flow - Congressional Trading Data
      </p>
    </div>
  `,
  text: `
    Welcome to Insider Flow!
    
    Please verify your email address by clicking the link below:
    ${verificationUrl}
    
    This link will expire in 1 hour. If you didn't create an account, you can safely ignore this email.
    
    Insider Flow - Congressional Trading Data
  `
};

sgMail.send(msg)
  .then(() => {
    console.log('✅ Registration verification email sent successfully!');
    console.log(`Check ${testEmail} inbox and spam folder`);
    console.log(`Verification URL: ${verificationUrl}`);
  })
  .catch((error) => {
    console.error('❌ Error sending registration email:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.body, null, 2));
    }
  });

#!/usr/bin/env node

// Email setup script for Insider Flow
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');

console.log('🔧 Email Configuration Setup for Insider Flow\n');

// Check if .env.local exists
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  process.exit(1);
}

// Read current .env.local
let envContent = fs.readFileSync(envPath, 'utf8');

console.log('Current email configuration:');
console.log('============================');

// Check SendGrid config
const sendgridApiKey = envContent.match(/SENDGRID_API_KEY="([^"]*)"/);
const sendgridFromEmail = envContent.match(/SENDGRID_FROM_EMAIL="([^"]*)"/);

if (sendgridApiKey) {
  console.log(`SENDGRID_API_KEY: ${sendgridApiKey[1].includes('your_') ? '❌ PLACEHOLDER' : '✅ CONFIGURED'}`);
}
if (sendgridFromEmail) {
  console.log(`SENDGRID_FROM_EMAIL: ${sendgridFromEmail[1].includes('yourname') ? '❌ PLACEHOLDER' : '✅ CONFIGURED'}`);
}

console.log('\n📧 To fix email functionality:');
console.log('1. Get a SendGrid API key from https://app.sendgrid.com/settings/api_keys');
console.log('2. Update your .env.local file with:');
console.log('   SENDGRID_API_KEY="SG.your_actual_api_key_here"');
console.log('   SENDGRID_FROM_EMAIL="noreply@insiderflow.com"');
console.log('\n3. Verify your sender email in SendGrid dashboard');
console.log('4. Test with: node test-email.js');

// Check if we can test the current config
if (sendgridApiKey && sendgridApiKey[1].includes('your_')) {
  console.log('\n⚠️  Current configuration has placeholder values - emails will fail!');
} else if (sendgridApiKey && sendgridFromEmail) {
  console.log('\n✅ Configuration looks good - ready to test!');
}


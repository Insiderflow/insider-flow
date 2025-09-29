#!/usr/bin/env node

// Check SendGrid account status and recent activity
require('dotenv').config({ path: '.env.local' });
const sgMail = require('@sendgrid/mail');

const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL;

console.log('🔍 Checking SendGrid Account Status\n');

console.log('Configuration:');
console.log(`API Key: ${apiKey ? '✅ Set' : '❌ Missing'}`);
console.log(`From Email: ${fromEmail}\n`);

if (!apiKey) {
  console.log('❌ SENDGRID_API_KEY not found');
  process.exit(1);
}

sgMail.setApiKey(apiKey);

// Test with a simple email to see detailed error
const testEmail = process.argv[2] || 'test@example.com';

console.log(`Testing email to: ${testEmail}`);

const msg = {
  to: testEmail,
  from: fromEmail,
  subject: 'SendGrid Test - ' + new Date().toISOString(),
  text: 'This is a test email to check SendGrid delivery.',
  html: '<p>This is a test email to check SendGrid delivery.</p>'
};

sgMail.send(msg)
  .then((response) => {
    console.log('\n✅ Email sent successfully!');
    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('\n📧 If you don\'t receive the email:');
    console.log('1. Check your SendGrid dashboard for delivery status');
    console.log('2. Verify the sender email is properly verified');
    console.log('3. Check SendGrid account limits and billing');
    console.log('4. Look for any account restrictions');
  })
  .catch((error) => {
    console.log('\n❌ Email sending failed:');
    console.log('Error:', error.message);
    
    if (error.response) {
      console.log('Status Code:', error.response.status);
      console.log('Response Body:', JSON.stringify(error.response.body, null, 2));
      
      // Check for specific error types
      if (error.response.body?.errors) {
        error.response.body.errors.forEach(err => {
          console.log(`\n🚨 Error: ${err.message}`);
          if (err.message.includes('verified Sender Identity')) {
            console.log('   → The sender email needs to be verified in SendGrid');
            console.log('   → Go to: https://app.sendgrid.com/settings/sender_auth');
          }
          if (err.message.includes('billing')) {
            console.log('   → Check your SendGrid billing and account status');
          }
          if (err.message.includes('rate limit')) {
            console.log('   → You\'ve hit SendGrid rate limits');
          }
        });
      }
    }
  });

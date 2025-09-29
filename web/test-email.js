// Enhanced email test script for Insider Flow
require('dotenv').config({ path: '.env.local' });
const sgMail = require('@sendgrid/mail');

console.log('🧪 Testing Email Configuration\n');

// Check environment variables
console.log('Environment Check:');
console.log('==================');

const requiredVars = {
  'SENDGRID_API_KEY': process.env.SENDGRID_API_KEY,
  'SENDGRID_FROM_EMAIL': process.env.SENDGRID_FROM_EMAIL,
  'NEXTAUTH_URL': process.env.NEXTAUTH_URL
};

let allConfigured = true;
for (const [key, value] of Object.entries(requiredVars)) {
  if (!value || value.includes('your_') || value.includes('yourname')) {
    console.log(`❌ ${key}: ${value || 'NOT SET'} (placeholder or missing)`);
    allConfigured = false;
  } else {
    console.log(`✅ ${key}: ${value.substring(0, 20)}...`);
  }
}

if (!allConfigured) {
  console.log('\n⚠️  Please update your .env.local file with real values!');
  console.log('Run: node setup-email.js for guidance');
  process.exit(1);
}

// Get test email from command line or use default
const testEmail = process.argv[2] || 'your-test-email@gmail.com';

if (testEmail.includes('your-test-email')) {
  console.log('\n💡 Usage: node test-email.js your-email@example.com');
  console.log('Using placeholder email for testing...\n');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: testEmail,
  from: process.env.SENDGRID_FROM_EMAIL,
  subject: 'Test Email from Insider Flow',
  text: `This is a test email to verify SendGrid is working!
  
Sent at: ${new Date().toISOString()}
From: ${process.env.SENDGRID_FROM_EMAIL}
To: ${testEmail}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">Test Email from Insider Flow</h2>
      <p>This is a test email to verify SendGrid is working!</p>
      <ul>
        <li><strong>Sent at:</strong> ${new Date().toISOString()}</li>
        <li><strong>From:</strong> ${process.env.SENDGRID_FROM_EMAIL}</li>
        <li><strong>To:</strong> ${testEmail}</li>
      </ul>
      <p style="color: #666; font-size: 14px; margin-top: 30px;">
        If you received this email, your SendGrid configuration is working correctly! 🎉
      </p>
    </div>
  `
};

console.log('Sending test email...');
console.log(`From: ${process.env.SENDGRID_FROM_EMAIL}`);
console.log(`To: ${testEmail}`);

sgMail.send(msg)
  .then(() => {
    console.log('\n✅ Test email sent successfully!');
    console.log('Check your inbox (and spam folder) for the test email.');
  })
  .catch((error) => {
    console.error('\n❌ Error sending test email:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response body:', JSON.stringify(error.response.body, null, 2));
      
      // Common error messages
      if (error.response.body?.errors) {
        error.response.body.errors.forEach(err => {
          console.error(`- ${err.message}`);
        });
      }
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify your SendGrid API key is correct');
    console.log('2. Check that your sender email is verified in SendGrid');
    console.log('3. Ensure your SendGrid account is not suspended');
    console.log('4. Check SendGrid usage limits');
  });


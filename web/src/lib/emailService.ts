import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function sendVerificationEmail(email: string, token: string) {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY not configured');
    throw new Error('Email service not configured');
  }

  if (!process.env.SENDGRID_FROM_EMAIL) {
    console.error('SENDGRID_FROM_EMAIL not configured');
    throw new Error('From email not configured');
  }

  const verificationUrl = `${process.env.NEXTAUTH_URL || 'https://insiderflow.asia'}/api/auth/verify?token=${token}`;
  
  // Debug log to see what URL is being generated
  console.log('EmailService - NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('EmailService - Generated URL:', verificationUrl);

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
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

  try {
    await sgMail.send(msg);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
}


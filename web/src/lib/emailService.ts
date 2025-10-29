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
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: 'Insider Flow'
    },
    replyTo: 'support@insiderflow.asia',
    subject: 'Verify your Insider Flow account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Account</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333333; font-size: 28px; margin: 0;">Welcome to Insider Flow</h1>
            <p style="color: #666666; font-size: 16px; margin: 10px 0 0 0;">Congressional Trading Data Platform</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <p style="color: #333333; font-size: 16px; margin: 0 0 15px 0;">Thank you for registering! To complete your account setup, please verify your email address.</p>
            <p style="color: #666666; font-size: 14px; margin: 0;">Click the button below to verify your account:</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #6366f1; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
              Verify Email Address
            </a>
          </div>
          
          <div style="border-top: 1px solid #e5e5e5; padding-top: 20px; margin-top: 30px;">
            <p style="color: #999999; font-size: 12px; margin: 0 0 10px 0;">
              <strong>Important:</strong> This verification link will expire in 1 hour for security reasons.
            </p>
            <p style="color: #999999; font-size: 12px; margin: 0 0 10px 0;">
              If you didn't create an account with Insider Flow, you can safely ignore this email.
            </p>
            <p style="color: #999999; font-size: 12px; margin: 0;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #6366f1; word-break: break-all;">${verificationUrl}</a>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
            <p style="color: #999999; font-size: 12px; margin: 0;">
              © 2024 Insider Flow. All rights reserved.<br>
              <a href="https://insiderflow.asia" style="color: #6366f1;">insiderflow.asia</a> | 
              <a href="mailto:support@insiderflow.asia" style="color: #6366f1;">support@insiderflow.asia</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to Insider Flow!
      
      Thank you for registering with Insider Flow - Congressional Trading Data Platform.
      
      To complete your account setup, please verify your email address by clicking the link below:
      
      ${verificationUrl}
      
      Important: This verification link will expire in 1 hour for security reasons.
      
      If you didn't create an account with Insider Flow, you can safely ignore this email.
      
      If you have any questions, please contact us at support@insiderflow.asia
      
      Best regards,
      The Insider Flow Team
      
      © 2024 Insider Flow. All rights reserved.
      insiderflow.asia
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


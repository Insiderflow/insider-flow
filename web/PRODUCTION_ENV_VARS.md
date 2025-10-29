# Production Environment Variables

Copy these environment variables to your production deployment (Render, Vercel, etc.):

```bash
# Database
DATABASE_URL="postgresql://neondb_owner:npg_sXci4KyhLrO9@ep-old-block-ad8jrimc-pooler.c-2.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"

# Session Management
SESSION_SECRET="your-32-character-secret-key-here"

# Email Service
GRIDSEND_API_KEY="gs_your_api_key_here"
EMAIL_FROM="no-reply@insiderflow.asia"

# Application URLs
NEXT_PUBLIC_BASE_URL="https://insiderflow.asia"
TRUST_PROXY=true

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://www.insiderflow.asia

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
NEXT_PUBLIC_STRIPE_PRICE_MONTHLY=your_monthly_price_id_here
NEXT_PUBLIC_STRIPE_PRICE_YEARLY=your_yearly_price_id_here
```

## Important Notes

- Replace all placeholder values with your actual credentials
- Never commit actual secrets to version control
- Use environment variable management in your deployment platform
- The Google OAuth credentials are already configured locally
- Test Google sign-in at: https://www.insiderflow.asia/login
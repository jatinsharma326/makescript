# MakeScript Deployment Guide

This guide covers deploying MakeScript to production with a full-fledged authentication system.

## Prerequisites

Before deploying, ensure you have:

1. **Supabase Project** - Set up at [supabase.com](https://supabase.com)
2. **GitHub Repository** - Your code pushed to GitHub
3. **Vercel Account** - For deployment at [vercel.com](https://vercel.com)

## Step 1: Supabase Setup

### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose a name and set a strong database password
4. Select a region close to your users
5. Wait for the project to be created (~2 minutes)

### 1.2 Get Your Credentials

1. Go to **Project Settings** > **API**
2. Copy the following:
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **anon/public key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 1.3 Configure Authentication

In the Supabase Dashboard:

1. Go to **Authentication** > **Providers**
2. Enable **Email** provider:
   - Enable "Confirm email" (recommended for production)
   - Set up email templates for verification and password reset

3. (Optional) Enable **Google** provider:
   - Create OAuth credentials in Google Cloud Console
   - Add the Client ID and Client Secret
   - Set redirect URL to: `https://your-domain.com/auth/callback`

### 1.4 Configure URL Settings

1. Go to **Authentication** > **URL Configuration**
2. Set **Site URL** to your production domain (e.g., `https://makescript.com`)
3. Add **Redirect URLs**:
   - `https://your-domain.com/auth/callback`
   - `https://your-domain.com/auth/reset-password`

### 1.5 Apply Database Schema

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy the contents of `supabase/schema.sql`
3. Execute the SQL to create tables and triggers

## Step 2: Vercel Deployment

### 2.1 Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Select the `makescript` repository

### 2.2 Configure Environment Variables

In Vercel Project Settings > Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Optional (for AI features):**
```
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key
```

**Optional (for payments):**
```
STRIPE_SECRET_KEY=your-stripe-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable
STRIPE_WEBHOOK_SECRET=your-webhook-secret
```

### 2.3 Deploy

1. Click "Deploy"
2. Wait for the build to complete (~2-3 minutes)
3. Your app will be live at `https://your-project.vercel.app`

### 2.4 Add Custom Domain

1. Go to Project Settings > Domains
2. Add your custom domain (e.g., `makescript.com`)
3. Update DNS records as instructed
4. Update Supabase URL configuration with your custom domain

## Step 3: Post-Deployment Checklist

### Security

- ✅ Dev Mode button is **hidden** in production (only shows when Supabase is not configured AND in development)
- ✅ Admin bypass is **disabled** in production
- ✅ Email verification is **enabled**
- ✅ Security headers are configured (X-Frame-Options, CSP, etc.)
- ✅ RLS (Row Level Security) is enabled on database tables

### Authentication Flow

1. **Sign Up**: User creates account → receives verification email → clicks link → account activated
2. **Sign In**: User enters credentials → redirected to editor
3. **Password Reset**: User clicks "Forgot password" → receives reset email → sets new password
4. **OAuth (optional)**: User clicks "Continue with Google" → redirected to Google → back to app

### Monitoring

1. Set up Vercel Analytics for traffic monitoring
2. Configure Supabase logs for auth events
3. Set up error tracking (e.g., Sentry)

## Step 4: Testing Production Auth

### Test Sign Up Flow

1. Visit your deployed site
2. Click "Sign up"
3. Enter name, email, password
4. Check email for verification link
5. Click verification link
6. Sign in with credentials

### Test Protected Routes

1. Try accessing `/editor` without logging in
2. Should redirect to `/login`
3. After login, should redirect back to `/editor`

### Test Password Reset

1. Click "Forgot password?"
2. Enter email
3. Check email for reset link
4. Click link and set new password
5. Sign in with new password

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anonymous key |
| `ANTHROPIC_API_KEY` | ❌ Optional | For AI video generation |
| `OPENAI_API_KEY` | ❌ Optional | For additional AI features |
| `STRIPE_SECRET_KEY` | ❌ Optional | For subscription payments |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ❌ Optional | Stripe public key |
| `STRIPE_WEBHOOK_SECRET` | ❌ Optional | For Stripe webhooks |

## Troubleshooting

### "Authentication service is not properly configured"

- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly
- Ensure URL includes `.supabase.co`

### "Email not confirmed"

- User needs to click the verification link in their email
- Check Supabase email logs for delivery issues
- Consider using a custom email template

### OAuth not working

- Verify redirect URL in Google OAuth settings matches exactly
- Check that Google provider is enabled in Supabase
- Ensure SITE_URL is set correctly in Supabase

### Protected routes not redirecting

- Middleware handles this automatically
- Check that cookies are being set properly
- Verify middleware matcher configuration

## Local Development

For local development without Supabase:

1. The app automatically enters "Dev Mode" when:
   - `NODE_ENV=development`
   - Supabase is not configured (missing or placeholder credentials)

2. Dev Mode features:
   - "Dev Mode (Skip Login)" button appears
   - Clicking it bypasses authentication
   - **Never available in production**

To test with real Supabase locally:

1. Copy `.env.example` to `.env.local`
2. Add your Supabase credentials
3. Run `npm run dev`

## Security Best Practices

1. **Never** commit `.env.local` to git
2. **Always** use environment variables in Vercel (not hardcoded)
3. **Enable** email verification in production
4. **Review** RLS policies regularly
5. **Monitor** authentication logs for suspicious activity
6. **Keep** dependencies updated

## Support

- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- Next.js Auth Guide: https://nextjs.org/docs/authentication
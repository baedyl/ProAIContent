# Quick Render Setup Guide

## The Error You're Seeing

```
Error: Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.
```

This error occurs because **environment variables are not set** in your Render service.

## Fix Steps

### 1. Go to Render Dashboard

Visit: https://dashboard.render.com/

### 2. Select Your Service

Click on "proai-content-studio" (or your service name)

### 3. Go to Environment Tab

Click on "Environment" in the left sidebar

### 4. Add Required Variables

Click "Add Environment Variable" and add each of these:

#### Critical (Must Have)
```
NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXTAUTH_URL = https://your-app.onrender.com
NEXTAUTH_SECRET = (generate with: openssl rand -base64 32)
OPENAI_API_KEY = sk-...
SERPAPI_KEY = ...
STRIPE_SECRET_KEY = sk_...
STRIPE_WEBHOOK_SECRET = whsec_...
```

### 5. Click "Save Changes"

Render will automatically redeploy with the new environment variables.

### 6. Wait for Build

The build should now succeed. Check the "Logs" tab to monitor progress.

## Where to Get These Values

### Supabase Keys
1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings > API
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role → `SUPABASE_SERVICE_ROLE_KEY` (Keep Secret!)

### NextAuth Secret
Run in your terminal:
```bash
openssl rand -base64 32
```
Copy the output to `NEXTAUTH_SECRET`

### NextAuth URL
Use your Render app URL (shown in dashboard):
```
https://your-app-name.onrender.com
```

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create a new secret key
3. Copy to `OPENAI_API_KEY`

### SerpAPI Key
1. Go to https://serpapi.com/manage-api-key
2. Copy your API key
3. Paste to `SERPAPI_KEY`

### Stripe Keys
1. Go to https://dashboard.stripe.com/apikeys
2. Copy secret key to `STRIPE_SECRET_KEY`
3. For webhook secret:
   - Go to https://dashboard.stripe.com/webhooks
   - Add endpoint: `https://your-app.onrender.com/api/stripe/webhook`
   - Copy signing secret to `STRIPE_WEBHOOK_SECRET`

## After Successful Deploy

### Test Your App
1. Visit your Render URL
2. Try creating an account
3. Test content generation
4. Test credit purchase

### Monitor Logs
Go to "Logs" tab in Render dashboard to see:
- Application startup
- API requests
- Any errors

## Common Issues

### "NEXTAUTH_URL not set"
- Make sure you added `NEXTAUTH_URL` with your actual Render URL
- Don't use `http://localhost:3000` in production

### "Invalid API Key" errors
- Double-check all API keys are copied correctly
- No extra spaces or quotes
- Keys should be the raw values

### Stripe webhooks not working
- Make sure endpoint URL matches your Render URL
- Webhook secret must match the one from Stripe dashboard
- Events to select: `checkout.session.completed`, `checkout.session.expired`

## Need Help?

1. Check build logs in Render dashboard
2. Verify all environment variables are set
3. Ensure no typos in variable names
4. Confirm all API keys are valid

---

Once all environment variables are set, Render will rebuild and your app should deploy successfully! 🚀


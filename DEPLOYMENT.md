# Deployment Guide for ProAI Content Studio

## Prerequisites

Before deploying to Render, ensure you have:

1. A [Render account](https://render.com)
2. A [Supabase project](https://supabase.com) set up with the required database schema
3. API keys for:
   - OpenAI API
   - SerpAPI
   - Stripe
4. (Optional) Google OAuth credentials

## Environment Variables

The following environment variables must be configured in your Render dashboard:

### Required Variables

#### Supabase
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (keep secret!)

#### NextAuth
- `NEXTAUTH_URL` - Your production URL (e.g., `https://your-app.onrender.com`)
- `NEXTAUTH_SECRET` - A random secret string (generate with `openssl rand -base64 32`)

#### OpenAI
- `OPENAI_API_KEY` - Your OpenAI API key
- `OPENAI_MODEL` - (Optional, defaults to `gpt-4-turbo-preview`)

#### SerpAPI
- `SERPAPI_KEY` - Your SerpAPI key for SERP analysis

#### Stripe
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook signing secret

### Optional Variables

#### Google OAuth (if using Google sign-in)
- `GOOGLE_CLIENT_ID` - Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth client secret
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Public Google client ID

#### App Configuration
- `NEXT_PUBLIC_APP_URL` - Your app's public URL

## Deployment Steps

### 1. Push to GitHub

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Create New Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml`

### 3. Configure Environment Variables

In the Render dashboard:

1. Go to your service's "Environment" tab
2. Add all required environment variables listed above
3. Click "Save Changes"

### 4. Configure Stripe Webhooks

After your app is deployed:

1. Get your Render URL (e.g., `https://your-app.onrender.com`)
2. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
3. Click "Add endpoint"
4. Set endpoint URL to: `https://your-app.onrender.com/api/stripe/webhook`
5. Select events to listen for:
   - `checkout.session.completed`
   - `checkout.session.expired`
6. Copy the webhook signing secret
7. Add it to Render as `STRIPE_WEBHOOK_SECRET`

### 5. Update Supabase Settings

1. Go to your Supabase project settings
2. Under "Authentication" > "URL Configuration"
3. Add your Render URL to "Site URL" and "Redirect URLs"

### 6. Deploy

Render will automatically deploy when you push to your main branch. You can also trigger a manual deploy from the Render dashboard.

## Post-Deployment

### Verify the Deployment

1. Check the build logs for any errors
2. Visit your app URL
3. Test user registration and login
4. Test content generation
5. Test credit purchase flow

### Monitor Your App

- View logs in the Render dashboard under "Logs"
- Set up alerts for errors
- Monitor resource usage

## Troubleshooting

### Build Fails with "Invalid supabaseUrl"

**Solution:** Ensure `NEXT_PUBLIC_SUPABASE_URL` is set in Render environment variables.

### NextAuth Error: "NEXTAUTH_URL not set"

**Solution:** Set `NEXTAUTH_URL` to your Render app URL (e.g., `https://your-app.onrender.com`).

### OpenAI API Errors

**Solution:** Verify `OPENAI_API_KEY` is correct and has sufficient credits.

### Stripe Webhook Not Working

**Solution:** 
1. Verify `STRIPE_WEBHOOK_SECRET` matches the one in Stripe dashboard
2. Test webhook delivery in Stripe dashboard
3. Check Render logs for webhook errors

### Database Connection Issues

**Solution:**
1. Verify all three Supabase keys are set correctly
2. Check Supabase project status
3. Ensure your IP isn't blocked in Supabase settings

## Scaling

### Upgrading Your Plan

As your app grows, consider:

1. **Starter → Standard:** Better performance, no cold starts
2. **Standard → Pro:** More resources for heavy content generation
3. **Database:** Upgrade Supabase plan for more storage and connections

### Performance Optimization

- Enable Redis for rate limiting (optional)
- Set up CDN for static assets
- Monitor and optimize API response times
- Consider background jobs for long-running content generation

## Security Checklist

- [ ] All secrets stored as environment variables (not in code)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is kept secret
- [ ] Stripe webhook secret is configured
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] SSL/HTTPS is enforced
- [ ] Environment variables are not logged

## Support

If you encounter issues:

1. Check the [Render documentation](https://render.com/docs)
2. Review application logs in Render dashboard
3. Check Supabase logs for database issues
4. Verify all environment variables are set correctly

## Development vs Production

### Local Development
- Uses `.env.local` file
- Stripe webhooks require Stripe CLI
- Can use manual credit completion tool at `/dev-tools`

### Production
- Uses Render environment variables
- Stripe webhooks work automatically
- Dev tools page is disabled

---

**Note:** Never commit `.env.local` or any files containing secrets to version control.


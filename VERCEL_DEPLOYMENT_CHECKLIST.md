# Vercel Deployment Checklist

Use this checklist to ensure a smooth deployment to Vercel.

## ✅ Pre-Deployment Checklist

### 1. Code Preparation
- [ ] All changes committed to Git
- [ ] Run `npm run build` locally to check for errors
- [ ] Run `npm run lint` to fix any linting issues
- [ ] Test the app locally with `npm run dev`

### 2. Environment Variables Prepared
Gather all these values before starting deployment:

- [ ] **NEXT_PUBLIC_SUPABASE_URL** (from Supabase dashboard)
- [ ] **NEXT_PUBLIC_SUPABASE_ANON_KEY** (from Supabase dashboard)
- [ ] **SUPABASE_SERVICE_ROLE_KEY** (from Supabase dashboard)
- [ ] **NEXTAUTH_SECRET** (generate with `openssl rand -base64 32`)
- [ ] **OPENAI_API_KEY** (from OpenAI platform)
- [ ] **SERPAPI_KEY** (from SerpAPI dashboard)
- [ ] **STRIPE_SECRET_KEY** (from Stripe dashboard)
- [ ] **GOOGLE_CLIENT_ID** (optional, for OAuth)
- [ ] **GOOGLE_CLIENT_SECRET** (optional, for OAuth)

### 3. External Services Ready
- [ ] Supabase project is active and database is set up
- [ ] OpenAI account has sufficient credits
- [ ] SerpAPI account is active
- [ ] Stripe account is configured and in live mode (or test mode for testing)

---

## 🚀 Deployment Steps

### Step 1: Import Project to Vercel
- [ ] Go to [vercel.com/new](https://vercel.com/new)
- [ ] Connect your Git provider (GitHub/GitLab/Bitbucket)
- [ ] Select the ProAI Writer repository
- [ ] Vercel auto-detects Next.js settings ✅

### Step 2: Configure Environment Variables
- [ ] Go to project **Settings** → **Environment Variables**
- [ ] Add all environment variables listed above
- [ ] Select environments: **Production**, **Preview**, **Development**
- [ ] Click **Save** for each variable

### Step 3: First Deploy
- [ ] Click **"Deploy"** button
- [ ] Wait for build to complete (2-5 minutes)
- [ ] Check build logs for any errors
- [ ] Note your Vercel deployment URL (e.g., `https://proai-writer.vercel.app`)

### Step 4: Update Dynamic URLs
- [ ] Go back to **Settings** → **Environment Variables**
- [ ] Update **NEXTAUTH_URL** with your Vercel URL
- [ ] Update **NEXT_PUBLIC_APP_URL** with your Vercel URL
- [ ] Save changes

### Step 5: Configure Stripe Webhook
- [ ] Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
- [ ] Click **"Add endpoint"**
- [ ] Endpoint URL: `https://YOUR-VERCEL-URL.vercel.app/api/stripe/webhook`
- [ ] Select events: `checkout.session.completed`, `checkout.session.expired`
- [ ] Copy the **Signing secret** (whsec_...)
- [ ] Add as **STRIPE_WEBHOOK_SECRET** in Vercel
- [ ] Save changes

### Step 6: Redeploy with Updated Variables
- [ ] Go to **Deployments** tab
- [ ] Click **⋯** on latest deployment → **"Redeploy"**
- [ ] Wait for new build to complete

---

## ✅ Post-Deployment Verification

### Test Basic Functionality
- [ ] Visit your Vercel URL
- [ ] Homepage loads correctly
- [ ] Can navigate between pages
- [ ] Styles and images load properly

### Test Authentication
- [ ] Can access login page
- [ ] Can register a new account
- [ ] Can log in with email/password
- [ ] Can log out
- [ ] Can access reset password (email is sent)
- [ ] Protected routes redirect to login when not authenticated

### Test Content Generation
- [ ] Dashboard loads with correct data
- [ ] Can start content generation workflow
- [ ] AI generates content successfully
- [ ] Generated content appears in contents list
- [ ] Can edit generated content
- [ ] Can delete generated content

### Test Credits System
- [ ] Credit balance displays correctly
- [ ] Can view credit packages
- [ ] Can initiate credit purchase (Stripe checkout)
- [ ] Test payment succeeds
- [ ] Credits are added after payment
- [ ] Credit usage is tracked when generating content

### Test Projects & Personas
- [ ] Can create new project
- [ ] Can edit project details
- [ ] Can create new persona
- [ ] Can edit persona settings
- [ ] Content can be assigned to projects

---

## 🔍 Troubleshooting Common Issues

### Build Fails
**Problem:** TypeScript or build errors
- [ ] Run `npm run build` locally
- [ ] Fix any TypeScript errors
- [ ] Push changes and redeploy

### "NEXTAUTH_URL not set" Error
**Problem:** Environment variable not configured
- [ ] Verify `NEXTAUTH_URL` is set in Vercel
- [ ] Matches your deployment URL exactly
- [ ] Includes `https://` protocol
- [ ] Redeploy after setting

### Database Connection Fails
**Problem:** Can't connect to Supabase
- [ ] Check Supabase project is active
- [ ] Verify all three Supabase env vars are set correctly
- [ ] Check for typos in URLs/keys
- [ ] Ensure no extra spaces in values

### Stripe Webhooks Not Working
**Problem:** Credits not added after payment
- [ ] Webhook URL matches Vercel URL exactly
- [ ] `STRIPE_WEBHOOK_SECRET` is correct
- [ ] Webhook is listening to correct events
- [ ] Check Stripe webhook logs for delivery status

### OpenAI API Errors
**Problem:** Content generation fails
- [ ] Verify `OPENAI_API_KEY` is correct
- [ ] Check OpenAI account has credits
- [ ] Check API key permissions
- [ ] Monitor OpenAI API status

---

## 🎯 Performance Optimization (Optional)

After successful deployment:

- [ ] Enable **Vercel Analytics** in Settings
- [ ] Enable **Speed Insights** in Settings
- [ ] Review **Function Logs** for errors
- [ ] Set up **custom domain** (optional)
- [ ] Configure **domain redirects** if needed

---

## 📊 Monitoring & Maintenance

### Regular Checks
- [ ] Monitor Vercel deployment logs
- [ ] Check Stripe webhook delivery logs
- [ ] Monitor OpenAI API usage
- [ ] Monitor Supabase database size
- [ ] Review SerpAPI usage limits

### Performance Monitoring
- [ ] Check Vercel Analytics dashboard
- [ ] Monitor function execution times
- [ ] Track error rates
- [ ] Review user feedback

---

## 🆘 Need Help?

If you encounter issues:

1. **Check Vercel Logs**
   - Go to Deployments → Select deployment → View Function Logs

2. **Check External Services**
   - Supabase: Check project logs
   - Stripe: Check webhook delivery logs
   - OpenAI: Check API usage dashboard

3. **Common Solutions**
   - Redeploy after changing environment variables
   - Clear browser cache if seeing old content
   - Verify all API keys are valid and active

---

## ✨ Success!

Once all items are checked, your ProAI Writer is successfully deployed on Vercel! 🎉

Your app benefits from:
- ⚡ Global edge network for fast access worldwide
- 🔄 Automatic deployments on every Git push
- 👀 Preview deployments for branches and PRs
- 📊 Built-in analytics and monitoring
- 🔐 Automatic HTTPS and security headers
- 💪 Optimized for Next.js performance

---

**Next Steps:**
- Share your app URL with users
- Set up a custom domain (optional)
- Monitor usage and performance
- Iterate based on user feedback


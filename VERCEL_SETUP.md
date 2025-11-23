# ProAI Writer - Vercel Deployment Guide

Vercel is the optimal platform for Next.js applications, offering seamless deployment with automatic builds, previews, and edge optimization.

## 🚀 Quick Deploy to Vercel

### Step 1: Connect Your Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub/GitLab/Bitbucket repository
4. Vercel will automatically detect it's a Next.js app

### Step 2: Configure Project Settings

Vercel auto-detects these settings (no changes needed):
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

Click **"Deploy"** but it will fail initially because environment variables aren't set yet.

### Step 3: Add Environment Variables

Go to your project → **Settings** → **Environment Variables**

Add these variables for all environments (Production, Preview, Development):

#### 🔴 Critical Variables (Must Have)

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# NextAuth Configuration
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# SerpAPI Configuration
SERPAPI_KEY=...

# Stripe Configuration
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

#### 🟡 Optional Variables (For OAuth)

```bash
# Google OAuth (if using Google sign-in)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
```

#### 📝 Environment Variable Notes

- For **NEXTAUTH_URL** and **NEXT_PUBLIC_APP_URL**: Use your Vercel domain (e.g., `https://proai-writer.vercel.app`)
- You can also use a custom domain once configured
- All `NEXT_PUBLIC_*` variables are exposed to the browser (don't put secrets there!)

### Step 4: Generate Required Secrets

#### NEXTAUTH_SECRET
Run in your terminal:
```bash
openssl rand -base64 32
```
Copy the output and use it as `NEXTAUTH_SECRET`

## 📍 Where to Get API Keys

### Supabase Keys
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ (Keep Secret!)

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new secret key
3. Copy to `OPENAI_API_KEY`

### SerpAPI Key
1. Go to [SerpAPI Dashboard](https://serpapi.com/manage-api-key)
2. Copy your API key
3. Paste to `SERPAPI_KEY`

### Stripe Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy **Secret key** to `STRIPE_SECRET_KEY`
3. For webhook secret (see Step 5 below)

## 🔔 Step 5: Configure Stripe Webhooks

**Important:** You need to update your Stripe webhook URL to point to Vercel.

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. If you have an existing webhook for Render, either:
   - Delete it, or
   - Create a new one for Vercel
3. Click **"Add endpoint"**
4. Set the endpoint URL:
   ```
   https://your-app.vercel.app/api/stripe/webhook
   ```
5. Select events to listen for:
   - `checkout.session.completed`
   - `checkout.session.expired`
6. Click **"Add endpoint"**
7. Copy the **Signing secret** (starts with `whsec_...`)
8. Add it to Vercel as `STRIPE_WEBHOOK_SECRET`

## 🔄 Step 6: Redeploy

After adding all environment variables:

1. Go to **Deployments** tab
2. Click the **⋯** menu on the latest deployment
3. Click **"Redeploy"**
4. Or simply push a new commit to trigger automatic deployment

## ✅ Step 7: Verify Deployment

Once deployed successfully:

1. Visit your Vercel URL
2. Test account creation/login
3. Test content generation
4. Test credit purchase (to verify Stripe integration)

## 🎯 Advantages of Vercel vs Render

- ✨ **Automatic Next.js optimization**
- ⚡ **Edge network** for faster global access
- 🔄 **Instant rollbacks** if something goes wrong
- 👀 **Preview deployments** for every git branch/PR
- 📊 **Built-in analytics** and performance monitoring
- 🔐 **Automatic SSL** certificates
- 💰 **More generous free tier** for Next.js apps

## 🔧 Custom Domain (Optional)

To use your own domain:

1. Go to your project → **Settings** → **Domains**
2. Add your custom domain
3. Update your DNS records as instructed
4. Update these environment variables with your custom domain:
   - `NEXTAUTH_URL`
   - `NEXT_PUBLIC_APP_URL`
5. Update your Stripe webhook URL
6. Redeploy

## 📊 Monitoring Your App

### View Logs
1. Go to your project dashboard
2. Click on a deployment
3. View **Build Logs** or **Function Logs**

### Performance Monitoring
- Vercel provides built-in **Analytics** and **Speed Insights**
- Enable them in **Settings** → **Analytics**

## ⚠️ Common Issues & Solutions

### "NEXTAUTH_URL not set" Error
- Make sure `NEXTAUTH_URL` is set to your actual Vercel URL
- Don't use `http://localhost:3000` in production
- Include the protocol: `https://your-app.vercel.app`

### Build Fails Due to TypeScript Errors
- Vercel is stricter than local builds
- Fix any TypeScript warnings/errors before deploying
- Run `npm run build` locally to catch issues

### Stripe Webhooks Not Working
- Verify the webhook URL matches your Vercel domain exactly
- Ensure `STRIPE_WEBHOOK_SECRET` is correct
- Check webhook logs in Stripe dashboard

### Environment Variables Not Applied
- Make sure variables are added to all environments (Production, Preview, Development)
- Redeploy after adding variables (changes aren't automatic)

### Database Connection Issues
- Verify Supabase URL and keys are correct
- Check Supabase dashboard for any connection limits
- Ensure your Supabase project is active

## 🚨 Important Notes

1. **Node.js Version:** Vercel uses Node.js 18.x by default (perfect for your app)
2. **Serverless Functions:** API routes automatically become serverless functions
3. **Cold Starts:** First request after inactivity may be slower (free tier)
4. **Build Time:** Free tier has build time limits (should be fine for this app)

## 🆚 Differences from Render

| Feature | Render | Vercel |
|---------|--------|--------|
| Config File | `render.yaml` | None needed (auto-detected) |
| Build Detection | Manual | Automatic |
| Deploy Trigger | Git push or manual | Git push (automatic) |
| Preview Deploys | ❌ | ✅ (automatic for PRs) |
| Next.js Optimization | Standard | Enhanced |
| Edge Network | Limited | Global |
| Free Tier | Basic | More generous for Next.js |

## 📚 Additional Resources

- [Vercel Docs](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables Guide](https://vercel.com/docs/concepts/projects/environment-variables)
- [Custom Domains](https://vercel.com/docs/concepts/projects/domains)

---

## 🎉 Ready to Deploy!

Once you've completed all steps above, your ProAI Writer app will be live on Vercel with:
- ⚡ Lightning-fast performance
- 🔄 Automatic deployments on every push
- 🌍 Global edge network
- 📊 Built-in analytics
- 🔒 Automatic HTTPS

Happy deploying! 🚀


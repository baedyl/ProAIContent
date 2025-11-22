# Fix: Login Page Redirect Loop on Vercel

## 🔴 Problem
App stuck at login page with redirect: `https://pro-ai-content.vercel.app/login?callbackUrl=%2F`

## ✅ Solutions (Follow in Order)

### Step 1: Check Environment Variables in Vercel

Go to: https://vercel.com/dashboard → Your Project → **Settings** → **Environment Variables**

#### Required Variables - Verify These Are Set:

```bash
# 1. NEXTAUTH_URL (CRITICAL!)
NEXTAUTH_URL=https://pro-ai-content.vercel.app

# 2. NEXTAUTH_SECRET (CRITICAL!)
NEXTAUTH_SECRET=<your-generated-secret>

# 3. Supabase (verify these are correct)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# 4. OpenAI
OPENAI_API_KEY=sk-...

# 5. Other required
SERPAPI_KEY=...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Common Mistakes:

❌ **WRONG:**
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_URL=https://your-app.vercel.app  (placeholder not replaced)
NEXTAUTH_URL=pro-ai-content.vercel.app    (missing https://)
```

✅ **CORRECT:**
```
NEXTAUTH_URL=https://pro-ai-content.vercel.app
```

### Step 2: Generate New NEXTAUTH_SECRET (if needed)

If you don't have `NEXTAUTH_SECRET` or need a new one:

```bash
# Run this in your terminal:
openssl rand -base64 32
```

Copy the output and add it to Vercel as `NEXTAUTH_SECRET`.

### Step 3: Apply Environment Variables to All Environments

Make sure variables are set for:
- ✅ Production
- ✅ Preview  
- ✅ Development

### Step 4: Redeploy After Changing Env Vars

**CRITICAL:** Environment variables don't apply until you redeploy!

Two ways to redeploy:

#### Option A: From Vercel Dashboard
1. Go to **Deployments** tab
2. Find latest deployment
3. Click **⋯** menu → **Redeploy**
4. Confirm

#### Option B: Push to Git
```bash
git add .
git commit -m "Fix middleware for landing page"
git push
```

Vercel will auto-deploy.

### Step 5: Clear Browser Cache

After redeploying:
1. Open your site: https://pro-ai-content.vercel.app
2. **Hard refresh:**
   - **Chrome/Edge:** Ctrl+Shift+R (Win) or Cmd+Shift+R (Mac)
   - **Firefox:** Ctrl+F5 (Win) or Cmd+Shift+R (Mac)
   - **Safari:** Cmd+Option+R
3. Or open in **Incognito/Private** window

### Step 6: Test Login

1. Go to: https://pro-ai-content.vercel.app/login
2. Enter your credentials
3. Click "Sign In"
4. Should redirect to dashboard

## 🔍 Debugging: Check Logs

If still not working, check Vercel logs:

1. Go to Vercel Dashboard → Your Project
2. Click **Deployments**
3. Click on latest deployment
4. View **Function Logs**
5. Look for errors related to:
   - "NEXTAUTH_URL"
   - "NEXTAUTH_SECRET"
   - "Invalid URL"
   - Authentication errors

## 🛠️ Additional Fixes

### Fix 1: Middleware Update (Already Done!)

The middleware now allows `/landing` page without authentication.

### Fix 2: Add Public Landing Page Route

If you want to make landing page accessible without login, it's now configured.

Test: https://pro-ai-content.vercel.app/landing (should work without login)

### Fix 3: Check Supabase Connection

Verify Supabase credentials:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Verify your keys match what's in Vercel

### Fix 4: Test API Routes

Test if API routes work:
```
https://pro-ai-content.vercel.app/api/auth/providers
```

Should return JSON with providers. If you get an error, check NEXTAUTH_SECRET.

## ✅ Checklist

Before asking for more help, verify:

- [ ] `NEXTAUTH_URL` is set to `https://pro-ai-content.vercel.app` (exact URL)
- [ ] `NEXTAUTH_SECRET` is set (32+ character random string)
- [ ] All Supabase env vars are correct
- [ ] Environment variables are set for all environments (Production/Preview/Development)
- [ ] You've redeployed after changing env vars
- [ ] You've cleared browser cache or tried incognito mode
- [ ] Checked Function Logs in Vercel for errors
- [ ] Pushed the middleware fix to Git

## 🎯 Expected Behavior After Fix

1. **Landing page** (`/landing`) → Works without login ✅
2. **Login page** (`/login`) → Shows login form ✅
3. **After login** → Redirects to dashboard ✅
4. **Protected pages** → Require authentication ✅

## 🆘 Still Not Working?

### Common Additional Issues:

#### Issue: "Error: NEXTAUTH_URL not set"
**Solution:** Make sure `NEXTAUTH_URL` is set in Vercel, not just locally.

#### Issue: "Error: Invalid URL"
**Solution:** Check `NEXTAUTH_URL` has `https://` prefix and no trailing slash.

#### Issue: "Cannot read properties of undefined"
**Solution:** Likely missing `NEXTAUTH_SECRET`. Generate and add one.

#### Issue: "Invalid credentials"
**Solution:** 
- Verify user exists in Supabase
- Check Supabase connection
- Try creating a new account

#### Issue: Still redirects to login after successful login
**Solution:**
- Check middleware configuration
- Verify session is being created (check cookies in browser DevTools)
- Check Function Logs for session errors

## 📊 Verify Deployment

### Check Your Live Site:

**Root:** https://pro-ai-content.vercel.app  
**Landing:** https://pro-ai-content.vercel.app/landing  
**Login:** https://pro-ai-content.vercel.app/login  
**Register:** https://pro-ai-content.vercel.app/register  

All should load without redirect loops.

## 🎉 Success Indicators

You'll know it's fixed when:
- ✅ Login page loads without redirecting
- ✅ You can enter credentials
- ✅ After login, you see the dashboard
- ✅ No infinite redirect loops
- ✅ Landing page works without auth

---

## Quick Command Reference

```bash
# Generate new NEXTAUTH_SECRET
openssl rand -base64 32

# Test local build (before deploying)
npm run build
npm run start

# Push to trigger redeploy
git add .
git commit -m "Fix authentication"
git push
```

---

**After completing all steps above, your app should work correctly!** 🚀


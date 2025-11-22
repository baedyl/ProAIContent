# Fix: Infinite Loop - /api/credits/balance Continuously Called

## 🔴 Problem

After logging in, the app continuously calls `/api/credits/balance`, causing:
- Infinite API requests
- Browser freezing/slowing down
- High API usage
- Poor user experience
- Vercel function quotas being consumed

## ✅ Solution Applied

I've implemented **multiple fixes** to resolve this issue:

### 1. **Added Global SWR Configuration** ✅

Created `/lib/swr-config.ts` with intelligent retry logic:
- **Stops retrying after 3 attempts** (prevents infinite loops)
- **Never retries on 401 (Unauthorized)** errors
- **Never retries on 404 (Not Found)** errors
- **Exponential backoff** for retries (5s, 10s, 15s)
- **Prevents automatic error retries** by default

### 2. **Updated API Route with Better Error Handling** ✅

File: `/app/api/credits/balance/route.ts`
- Added detailed logging for debugging
- Better error messages
- Fallback to `token.sub` if `token.id` is not available
- More robust session checking

### 3. **Fixed Session Callback** ✅

File: `/lib/auth.ts`
- Now uses `token.sub` as fallback for user ID
- Always ensures `session.user.id` is set
- Added error logging for production debugging

### 4. **Applied Global SWR Config to All Pages** ✅

File: `/app/providers.tsx`
- Wrapped app with `SWRConfig` provider
- Applies retry logic globally
- All SWR hooks now use these settings

### 5. **Updated Navbar Component** ✅

File: `/components/Navbar.tsx`
- Added specific error retry configuration
- Limited retries to 3 attempts
- 5-second delay between retries

## 🔍 Root Cause Analysis

The infinite loop was caused by:

1. **Session.user.id not being set properly**
   - NextAuth wasn't passing the user ID correctly to the session
   - API route couldn't find user ID → returned 401
   - SWR kept retrying the failed request

2. **No SWR error handling**
   - Default SWR behavior: retry forever on errors
   - Each retry triggered immediately
   - Created infinite request loop

3. **Missing fallback logic**
   - If `token.id` wasn't set, no fallback to `token.sub`
   - Session ended up with no user ID

## 🚀 Deploy the Fix

### Step 1: Push Changes to Git

```bash
git add .
git commit -m "Fix: Prevent infinite loop in credits/balance API"
git push
```

Vercel will automatically deploy.

### Step 2: Verify Environment Variables (Again)

Double-check these are **still set correctly** in Vercel:

```bash
NEXTAUTH_URL=https://pro-ai-content.vercel.app
NEXTAUTH_SECRET=<your-secret>
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Step 3: Check Vercel Function Logs

After deploying:
1. Go to Vercel Dashboard → Your Project
2. Click **Deployments** → Latest deployment
3. View **Function Logs**
4. Look for:
   - ✅ "Session callback: ..." (should show user ID)
   - ❌ "No user ID in session" (shouldn't appear anymore)
   - ❌ "Credits balance error" (shouldn't appear repeatedly)

### Step 4: Test in Browser

1. Clear browser cache: `Ctrl+Shift+Del` (Chrome) or `Cmd+Shift+Del` (Mac)
2. Open **DevTools** → **Network** tab
3. Go to: https://pro-ai-content.vercel.app/login
4. Log in with your credentials
5. Watch the Network tab

**Expected Behavior:**
- `/api/credits/balance` called **once** on page load ✅
- No repeated calls ✅
- Dashboard loads normally ✅

**If still looping:**
- Check Network tab for response status
- If 401: Session issue (check logs for "No user ID")
- If 500: Database connection issue (check Supabase)

## 🔧 Additional Debugging

### Check Session in Browser Console

After logging in, open **DevTools Console** and run:

```javascript
// Check if session exists
fetch('/api/auth/session')
  .then(r => r.json())
  .then(data => console.log('Session:', data))
```

**Expected Output:**
```json
{
  "user": {
    "id": "user-uuid-here",
    "email": "user@example.com",
    "name": "User Name",
    "creditsBalance": 1000
  },
  "expires": "2025-..."
}
```

**If `id` is missing** → Session callback issue (check Vercel logs)

### Check API Route Directly

```javascript
fetch('/api/credits/balance')
  .then(r => r.json())
  .then(data => console.log('Balance:', data))
```

**Expected Output:**
```json
{
  "balance": 1000,
  "trialCreditsGiven": true,
  "stripeCustomerId": "cus_..."
}
```

**If error** → Check what error message is returned

### Monitor Network Requests

In DevTools Network tab:
1. Filter by: `credits`
2. Watch for repeated requests
3. Click on a request to see:
   - **Status Code** (should be 200)
   - **Response** (should have balance data)
   - **Headers** (check cookies are being sent)

## 🛡️ Prevention

The fixes I applied will prevent this from happening again:

1. **Global retry limits** - Max 3 retries, then stops
2. **Smart error handling** - Never retries 401/404 errors
3. **Exponential backoff** - Waits longer between retries
4. **Better session management** - Always sets user ID with fallback
5. **Detailed logging** - Easy to debug if issues occur

## ✅ Verification Checklist

After deploying, verify:

- [ ] Login works without hanging
- [ ] Dashboard loads in < 3 seconds
- [ ] `/api/credits/balance` called only once per page
- [ ] No console errors in browser DevTools
- [ ] Vercel Function Logs show successful requests
- [ ] Credit balance displays correctly in navbar
- [ ] No "Unauthorized" errors in logs
- [ ] SWR requests stop after max retries (if any errors)

## 🎯 Expected Performance

After fix:
- **Login time:** < 2 seconds
- **Dashboard load:** < 3 seconds
- **API calls:** 1 per page load (+ 1 every 30 seconds for refresh)
- **Error retries:** Max 3, then stops
- **Vercel function usage:** Normal levels

## 🆘 Still Having Issues?

### Issue 1: Still sees infinite requests

**Check:**
- Did you deploy after making changes?
- Clear browser cache completely
- Try incognito/private window
- Check Vercel logs for the actual error

**Solution:**
```bash
# Force redeploy
git commit --allow-empty -m "Force redeploy"
git push
```

### Issue 2: "Unauthorized" errors in logs

**Cause:** Session not being created properly

**Check:**
1. `NEXTAUTH_URL` matches your domain exactly
2. `NEXTAUTH_SECRET` is set
3. User exists in Supabase database

**Solution:**
- Verify all environment variables
- Try creating a new user account
- Check Supabase dashboard for user

### Issue 3: "No user ID in session" in logs

**Cause:** JWT callback not setting token.id

**Check:**
- Verify user was created in Supabase successfully
- Check if `authorize` function returns correct user object

**Solution:**
- Add more logging in auth.ts jwt callback
- Verify Supabase connection works
- Test with a fresh user account

### Issue 4: Database connection errors

**Cause:** Supabase credentials incorrect

**Check:**
1. Supabase project is active
2. All 3 Supabase env vars are correct
3. Service role key has proper permissions

**Solution:**
- Re-copy Supabase keys from dashboard
- Verify no extra spaces in env vars
- Test Supabase connection from Vercel

## 📊 Monitoring

### Set Up Monitoring

To prevent future issues:

1. **Vercel Analytics** (if available)
   - Monitor API call frequency
   - Watch for spikes in `/api/credits/balance`

2. **Browser DevTools**
   - Keep Network tab open during testing
   - Watch for unusual patterns

3. **Vercel Function Logs**
   - Check regularly for errors
   - Set up alerts for high error rates

### Normal vs Abnormal Behavior

**Normal:**
```
Page Load → /api/credits/balance (1 call)
Wait 30s → /api/credits/balance (1 call)
Wait 30s → /api/credits/balance (1 call)
```

**Abnormal (fixed now):**
```
Page Load → /api/credits/balance (100+ calls in 10 seconds) ❌
```

## 🎉 Success Indicators

You'll know it's fixed when:
- ✅ Login is fast (< 2 seconds)
- ✅ Dashboard loads without delay
- ✅ Network tab shows minimal API calls
- ✅ No browser slowdown/freezing
- ✅ Credits display correctly
- ✅ No repeated error messages in logs
- ✅ Smooth navigation between pages

---

## Quick Command Reference

```bash
# Deploy fix
git add .
git commit -m "Fix infinite loop"
git push

# Check logs
vercel logs <deployment-url>

# Force redeploy
git commit --allow-empty -m "Redeploy"
git push

# Test locally first
npm run build
npm run start
```

---

**The fix is comprehensive and should resolve the infinite loop completely!** 🚀

If you still experience issues after deploying, check the Vercel Function Logs for specific error messages and let me know what you see.


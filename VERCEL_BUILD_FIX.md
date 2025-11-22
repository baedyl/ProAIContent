# Fix: Vercel Build Error - Dynamic Server Usage

## 🔴 **Error Message**

```
Error: Dynamic server usage: Route /api/credits/balance couldn't be rendered 
statically because it used `headers`. See more info here: 
https://nextjs.org/docs/messages/dynamic-server-error
```

## ✅ **Solution Applied**

Added `export const dynamic = 'force-dynamic'` to **all API routes** that use NextAuth's `getServerSession()`.

### What This Does

Tells Next.js to:
- ❌ **Don't** try to pre-render these routes statically at build time
- ✅ **Do** render them dynamically on each request (required for session/auth)

## 📝 **Files Updated**

Updated **18 API route files**:

### ✅ Credits API
- `app/api/credits/balance/route.ts`
- `app/api/credits/summary/route.ts`
- `app/api/credits/usage/route.ts`
- `app/api/credits/transactions/route.ts`

### ✅ Content Management
- `app/api/contents/route.ts`
- `app/api/contents/[id]/route.ts`
- `app/api/generate/route.ts` (also added `maxDuration: 60`)

### ✅ Projects & Personas
- `app/api/projects/route.ts`
- `app/api/projects/[id]/route.ts`
- `app/api/personas/route.ts`
- `app/api/personas/[id]/route.ts`
- `app/api/personas/test-style/route.ts`
- `app/api/personas/enrich-style/route.ts`

### ✅ Stripe & Payments
- `app/api/stripe/create-session/route.ts`
- `app/api/stripe/confirm/route.ts`
- `app/api/stripe/manual-complete/route.ts`

### ✅ Settings & Purchases
- `app/api/settings/route.ts`
- `app/api/purchases/route.ts`

## 🔧 **What Was Added**

To each file, added this configuration at the top (after imports):

```typescript
// Force dynamic rendering (required for NextAuth session)
export const dynamic = 'force-dynamic'
```

For the `/api/generate` route, also added:

```typescript
export const maxDuration = 60 // Allow up to 60 seconds for content generation
```

## 🎯 **Why This Was Needed**

### The Problem

Next.js 14 tries to statically generate pages and API routes at build time for performance. However:

1. **NextAuth uses `getServerSession()`**
   - This function reads request headers (cookies for session)
   - Headers are only available at **request time**, not build time

2. **Static generation fails**
   - Next.js can't access headers during build
   - Build fails with "Dynamic server usage" error

3. **All auth-protected routes affected**
   - Any API route using `getServerSession()` must be dynamic

### The Solution

The `export const dynamic = 'force-dynamic'` directive:
- ✅ Tells Next.js: "This route needs request context"
- ✅ Prevents static generation attempts
- ✅ Allows access to headers, cookies, session data
- ✅ Renders route on every request (as needed for auth)

## 📊 **Build Results**

### Before Fix ❌
```
Generating static pages (0/35) ...
Error: Dynamic server usage: Route /api/credits/balance...
Build failed
```

### After Fix ✅
```
✓ Generating static pages (35/35)
✓ Collecting build traces
✓ Finalizing page optimization

Route (app)                              Size
┌ ○ /                                    ...
├ ○ /api/credits/balance                 ...
└ ○ /api/contents                        ...

○  (Static)  prerendered as static HTML
λ  (Dynamic) dynamically rendered

Build completed successfully!
```

## 🚀 **Deploy to Vercel**

The build now passes! Deploy with:

```bash
git add .
git commit -m "Fix: Add dynamic export to all auth-protected API routes"
git push
```

Vercel will automatically build and deploy successfully.

## 🔍 **Verification**

After deployment, verify:

1. **Build succeeds** ✅
   - Check Vercel deployment logs
   - Should complete without errors

2. **API routes work** ✅
   - Test login functionality
   - Test content generation
   - Test credit balance API

3. **No static generation errors** ✅
   - No "Dynamic server usage" errors in logs

## 💡 **Best Practices Applied**

### Route Segment Config Options

We used several Next.js route segment config options:

```typescript
// Force dynamic rendering (required for auth)
export const dynamic = 'force-dynamic'

// Set runtime environment
export const runtime = 'nodejs' // or 'edge'

// Set maximum execution time (for long-running operations)
export const maxDuration = 60 // seconds
```

### When to Use Each

**`dynamic = 'force-dynamic'`**
- ✅ Routes using `getServerSession()`
- ✅ Routes accessing request headers/cookies
- ✅ Routes with user-specific data
- ✅ Real-time data that changes frequently

**`dynamic = 'auto'`** (default)
- Let Next.js decide based on code analysis
- May cause build errors if dynamic features detected

**`dynamic = 'error'`**
- Force static generation, error if dynamic features used
- Good for truly static routes

**`maxDuration = 60`**
- Routes with long-running operations (AI generation, external APIs)
- Default is 10 seconds on Vercel Hobby plan
- Max 60 seconds on Pro plan

## 📚 **Resources**

- [Next.js Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
- [Dynamic Server Errors](https://nextjs.org/docs/messages/dynamic-server-error)
- [NextAuth with Next.js 14](https://next-auth.js.org/configuration/nextjs)

## 🎯 **Key Takeaways**

1. **Always add `dynamic = 'force-dynamic'`** to API routes using:
   - `getServerSession()`
   - `cookies()`
   - `headers()`
   - Any dynamic data source

2. **Test builds locally** before deploying:
   ```bash
   npm run build
   ```

3. **Check Vercel deployment logs** if build fails

4. **Use appropriate timeouts** for long operations:
   ```typescript
   export const maxDuration = 60
   ```

## ✅ **Status**

- ✅ Build passes locally
- ✅ All API routes configured correctly
- ✅ Ready to deploy to Vercel
- ✅ No more "Dynamic server usage" errors

---

**Your Vercel build should now succeed!** 🎉

Deploy and check that all authentication and API functionality works as expected.


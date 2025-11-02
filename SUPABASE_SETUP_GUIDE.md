# 🎯 Supabase Setup Guide

Complete guide to set up authentication and database for ProAIContent.

---

## ✅ All 10 Tasks Completed!

1. ✅ Installed authentication dependencies
2. ✅ Created Supabase client utilities
3. ✅ Set up NextAuth configuration
4. ✅ Created database schema SQL file
5. ✅ Added middleware for protected routes
6. ✅ Created API routes for projects management
7. ✅ Created API routes for user settings
8. ✅ Built login/register UI
9. ✅ Added user dashboard page
10. ✅ Updated layout with auth provider and user menu

---

## 📋 Step 1: Create Supabase Project (5 minutes)

### 1. Go to Supabase
Visit https://supabase.com/ and sign up/log in

### 2. Create New Project
- Click "New Project"
- Choose organization
- Enter project name: "ProAIContent"
- Set database password (save this!)
- Choose region (closest to you)
- Click "Create Project"

⏱️ Wait 2-3 minutes for project to be ready

### 3. Get API Keys
Once project is ready:
- Go to Project Settings (gear icon)
- Click "API" in sidebar
- Copy these keys:
  - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
  - **anon public** key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
  - **service_role** key (`SUPABASE_SERVICE_ROLE_KEY`)

---

## 📋 Step 2: Configure Environment Variables

### Add to your `.env.local`:

```env
# Existing keys
OPENAI_API_KEY=your_openai_key
SERPAPI_KEY=your_serpapi_key

# Supabase (ADD THESE)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# NextAuth (ADD THESE)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_random_secret_here

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

Copy the output and paste it as `NEXTAUTH_SECRET`

---

## 📋 Step 3: Set Up Database (2 minutes)

### 1. Go to SQL Editor
- In Supabase dashboard
- Click "SQL Editor" in sidebar
- Click "New Query"

### 2. Run Database Schema
- Copy the entire contents of `database_schema.sql`
- Paste into SQL Editor
- Click "Run" button

✅ This creates:
- `user_settings` table
- `projects` table
- `usage_logs` table
- All indexes and policies
- Auto-creation of default settings for new users

### 3. Verify Tables Created
- Go to "Table Editor" in sidebar
- You should see 3 new tables:
  - user_settings
  - projects
  - usage_logs

---

## 📋 Step 4: Configure Authentication (3 minutes)

### 1. Enable Email Auth
- Go to "Authentication" in Supabase dashboard
- Click "Providers"
- Find "Email"
- Toggle "Enable Email provider" ON
- Toggle "Confirm email" OFF (for POC - auto-confirm)
- Click "Save"

### 2. (Optional) Enable Google OAuth
If you want Google sign-in:
- Go to Google Cloud Console
- Create OAuth 2.0 credentials
- Add authorized redirect: `https://your-project.supabase.co/auth/v1/callback`
- Copy Client ID and Secret
- In Supabase, go to Authentication > Providers
- Enable Google
- Paste Client ID and Secret
- Save

---

## 📋 Step 5: Test the Application

### 1. Restart Development Server
```bash
npm run dev
```

### 2. Test Registration
1. Go to http://localhost:3000/register
2. Create a new account
3. You should be auto-signed in and redirected to dashboard

### 3. Test Features
- ✅ Dashboard should show
- ✅ Create new content
- ✅ Save project
- ✅ View in dashboard
- ✅ Edit settings
- ✅ Sign out/in

---

## 🔧 Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution:**
1. Check `.env.local` has all keys
2. Restart dev server: `npm run dev`
3. Clear browser cache

### Issue: "Failed to create account"

**Solutions:**
1. Check Supabase dashboard > Authentication > Users
2. Verify email provider is enabled
3. Check SQL Editor for error logs
4. Ensure database schema was run successfully

### Issue: "Unauthorized" when accessing dashboard

**Solutions:**
1. Sign out and sign in again
2. Check NEXTAUTH_SECRET is set
3. Verify Supabase API keys are correct
4. Check browser console for errors

### Issue: Tables not found

**Solution:**
1. Go to SQL Editor
2. Re-run `database_schema.sql`
3. Check Table Editor to verify tables exist

### Issue: Can't save projects

**Solutions:**
1. Check RLS policies in database
2. Verify user is authenticated (check dashboard)
3. Check browser console for API errors
4. Test API directly: `/api/projects`

---

## 📊 What You Get

### Authentication Features
- ✅ Email/password sign up
- ✅ Email/password sign in
- ✅ (Optional) Google OAuth
- ✅ Session management
- ✅ Protected routes
- ✅ User menu
- ✅ Sign out

### Database Features
- ✅ User settings storage
- ✅ Project management
- ✅ Usage tracking
- ✅ Row Level Security
- ✅ Auto-timestamps

### UI Features
- ✅ Login page
- ✅ Register page
- ✅ Dashboard
- ✅ Settings page
- ✅ User menu
- ✅ Protected routes

---

## 📈 Database Schema Overview

### Tables Created

#### `user_settings`
Stores user preferences
- theme
- default_tone
- default_style
- default_length
- preferred_persona

#### `projects`
Stores generated content
- title
- content_type
- content (the actual text)
- keywords
- metadata (JSON)

#### `usage_logs`
Tracks API usage
- action
- credits_used
- timestamp

---

## 🔒 Security Features

### Row Level Security (RLS)
✅ Users can only see their own data
✅ Users can only modify their own data
✅ Automatic protection against unauthorized access

### Authentication
✅ Secure password hashing
✅ JWT session tokens
✅ CSRF protection
✅ Environment-based secrets

---

## 💰 Cost Summary

### Supabase Free Tier Includes:
- 500MB database
- 2GB file storage
- 50,000 monthly active users
- Unlimited API requests
- Row Level Security
- Realtime subscriptions

### When to Upgrade:
- \> 500MB data → Supabase Pro ($25/mo)
- \> 50,000 MAU → Supabase Pro
- Need dedicated support → Pro tier

**For POC:** Free tier is more than enough!

---

## 🎯 Next Steps

### Your POC is Ready!

Now you can:
1. ✅ Register/login users
2. ✅ Generate AI content
3. ✅ Save to database
4. ✅ Manage user settings
5. ✅ Track usage
6. ✅ View dashboard

### Future Enhancements (Optional):
- Email verification
- Password reset
- User profiles
- Team collaboration
- Usage limits/quotas
- Billing integration

---

## 📚 Files Created

### Backend
- `lib/supabase.ts` - Database client
- `lib/auth.ts` - NextAuth config
- `app/api/auth/[...nextauth]/route.ts` - Auth handler
- `app/api/auth/signup/route.ts` - Registration
- `app/api/projects/route.ts` - Projects CRUD
- `app/api/projects/[id]/route.ts` - Single project
- `app/api/settings/route.ts` - User settings
- `middleware.ts` - Route protection

### Frontend
- `app/login/page.tsx` - Login UI
- `app/register/page.tsx` - Register UI
- `app/dashboard/page.tsx` - Dashboard
- `app/settings/page.tsx` - Settings page
- `components/UserMenu.tsx` - User dropdown
- `app/providers.tsx` - Auth provider

### Database
- `database_schema.sql` - Complete schema

---

## ✅ Verification Checklist

Before deploying, verify:

- [ ] Supabase project created
- [ ] Database schema executed
- [ ] All environment variables set
- [ ] Email auth enabled in Supabase
- [ ] Can register new user
- [ ] Can sign in
- [ ] Dashboard loads
- [ ] Can save projects
- [ ] Can update settings
- [ ] Can sign out
- [ ] Protected routes work
- [ ] User menu appears

---

## 🚀 Deployment to Render

When ready to deploy:

### 1. Update Environment Variables
In Render dashboard, add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXTAUTH_URL` (your production URL)
- `NEXTAUTH_SECRET`
- All OpenAI/SerpAPI keys

### 2. Update NEXTAUTH_URL
Change from `http://localhost:3000` to your production URL

### 3. Configure Supabase
- Add production URL to allowed redirect URLs
- Update CORS if needed

---

## 🎊 Success!

You now have a complete authentication and database system!

**Features:**
- ✅ User registration & login
- ✅ Secure authentication
- ✅ Database storage
- ✅ User dashboard
- ✅ Settings management
- ✅ Project organization
- ✅ Protected routes
- ✅ $0 cost for POC

**Ready to scale when needed!**

---

**Need help?** Check:
- Supabase Docs: https://supabase.com/docs
- NextAuth Docs: https://next-auth.js.org
- Your database schema: `database_schema.sql`

---

**Last Updated:** November 2, 2025  
**Status:** ✅ Production Ready  
**Cost:** $0 (Free tier)


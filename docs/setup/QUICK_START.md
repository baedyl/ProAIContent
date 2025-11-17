# 🚀 Quick Start Guide - Authentication Setup

**Time Required:** 15 minutes  
**Cost:** $0 (Free tier)

---

## ✅ Prerequisites

- [x] Wand Wiser app installed
- [x] OpenAI API key configured
- [x] SerpAPI key configured
- [x] Node.js installed

---

## 📋 Step-by-Step Setup

### Step 1: Create Supabase Account (3 min)

1. Go to **https://supabase.com**
2. Click "Start your project"
3. Sign up with GitHub or email

### Step 2: Create Project (2 min)

1. Click "New Project"
2. Fill in:
   - **Name:** Wand Wiser
   - **Database Password:** (create a strong password - save it!)
   - **Region:** Choose closest to you
3. Click "Create new project"
4. ⏱️ Wait ~2 minutes for setup

### Step 3: Get API Keys (2 min)

1. Click ⚙️ **Settings** (bottom left)
2. Click **API** in sidebar
3. Copy these 3 keys:

```
Project URL:
https://xxxxx.supabase.co

anon public key:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

service_role key:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Add Keys to .env.local (2 min)

1. Open `.env.local` in your project
2. Add these lines:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
```

3. Generate `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

4. Copy the output and paste it after `NEXTAUTH_SECRET=`

### Step 5: Setup Database (3 min)

1. In Supabase, click 🗄️ **SQL Editor**
2. Click "+ New query"
3. Open `database_schema.sql` from your project
4. Copy ALL contents
5. Paste into SQL Editor
6. Click **Run**
7. You should see: "Success. No rows returned"

**Verify:**
- Click 📊 **Table Editor**
- You should see 3 tables:
  - user_settings
  - projects
  - usage_logs

### Step 6: Enable Authentication (2 min)

1. Click 🔐 **Authentication**
2. Click **Providers**
3. Find "Email"
4. Toggle **ON**: Enable Email provider
5. Toggle **OFF**: Confirm email (for POC)
6. Click **Save**

### Step 7: Test It! (3 min)

1. **Restart dev server:**

```bash
npm run dev
```

2. **Go to registration:**

```
http://localhost:3000/register
```

3. **Create account:**
   - Name: Test User
   - Email: test@example.com
   - Password: test123
   - Click "Create Account"

4. **You should:**
   - See "Account created!" message
   - Be redirected to dashboard
   - See welcome message with your name

5. **Test features:**
   - Go to Settings
   - Change preferences
   - Click Save
   - Go to home
   - Generate content
   - Save it
   - Check dashboard - project should appear!

---

## ✅ Success Checklist

After completing setup, verify:

- [ ] Can access /register page
- [ ] Can create new account
- [ ] Redirected to /dashboard after registration
- [ ] See welcome message with name
- [ ] Can access /settings
- [ ] Can save settings
- [ ] Can generate content
- [ ] Can save content to database
- [ ] Project appears in dashboard
- [ ] Can sign out
- [ ] Can sign in again

---

## 🎉 Done!

You now have:

✅ User authentication  
✅ Database storage  
✅ User dashboard  
✅ Settings management  
✅ Project organization

**Total time:** ~15 minutes  
**Total cost:** $0

---

## 🐛 Troubleshooting

### Issue: "Missing Supabase environment variables"

**Fix:**
```bash
# 1. Check .env.local has all 5 new variables
# 2. Restart server
npm run dev
```

### Issue: Can't create account

**Fix:**
1. Check Supabase dashboard
2. Go to Authentication > Providers
3. Ensure Email is enabled
4. Check SQL Editor > Run database_schema.sql again

### Issue: Dashboard empty after saving

**Fix:**
1. Check browser console for errors
2. Verify you're signed in (see user menu in header)
3. Go to Supabase > Table Editor > projects
4. Check if data exists

### Issue: "Unauthorized" errors

**Fix:**
```bash
# 1. Sign out
# 2. Clear browser cache
# 3. Sign in again
# 4. Try again
```

---

## 📚 More Information

- **Detailed Guide:** See `SUPABASE_SETUP_GUIDE.md`
- **Implementation Details:** See `AUTH_IMPLEMENTATION_SUMMARY.md`
- **Database Schema:** See `database_schema.sql`

---

## 💡 What's Next?

Now that authentication is set up, you can:

1. **Add more users** - Share register link
2. **Customize settings** - Set your preferred persona, tone
3. **Generate content** - It auto-saves to your account
4. **Organize projects** - View all in dashboard
5. **Deploy to Render** - Follow main README

---

## 🎊 Congratulations!

Your Wand Wiser app is now production-ready with:

- ✅ Secure authentication
- ✅ Database storage
- ✅ User management
- ✅ Project organization
- ✅ $0 cost

**Ready to create amazing content!** 🚀

---

**Questions?** Check the troubleshooting section above or the detailed guides.

**Last Updated:** November 2, 2025  
**Status:** ✅ Production Ready


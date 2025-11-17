# 🚨 IMPORTANT: Set Up Database NOW

## Your signup is failing because the database tables don't exist yet!

### ⚡ Quick Fix (2 minutes):

1. **Go to Supabase:**
   https://wboyfwcxdgpaxhxlrhrp.supabase.co

2. **Click SQL Editor** (left sidebar)

3. **Click "+ New query"**

4. **Open `database_schema.sql`** from your project folder

5. **Copy ALL contents** (Ctrl+A, Ctrl+C)

6. **Paste into SQL Editor**

7. **Click RUN** (or press Cmd+Enter)

8. **You should see:** "Success. No rows returned"

9. **Verify tables created:**
   - Click **Table Editor** (left sidebar)
   - You should see 3 tables:
     - user_settings ✓
     - projects ✓
     - usage_logs ✓

10. **Test signup again!**
    - Go to http://localhost:3000/register
    - Should work now! 🎉

---

### 🧼 If you ran the old schema before todays update

Run this once in the SQL editor to remove the legacy trigger that caused the `Database error creating new user` problem:

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
```

Then try signing up again.

---

## Still Not Working?

### Check Browser Console for Errors:

1. Open browser dev tools (F12)
2. Go to Console tab
3. Try to sign up
4. Look for error messages
5. Share the error with me

### Check Terminal for Errors:

In your terminal where `npm run dev` is running, you should see:
- "Signup attempt for: [email]"
- Either "User created successfully" or an error message

Share what you see!


# 🗄️ ProAI Writer - Complete Database Setup Guide

## 🚨 Error: "Could not find the table 'public.projects' in the schema cache"

This error means your Supabase database hasn't been initialized yet. This guide will help you set it up in **5 minutes**.

---

## 🎯 What You'll Get

After completing this setup, your ProAI Writer will have:

✅ **SEO-Optimized Content Generation**
- Auto-analyzes top-ranking pages (SERP analysis)
- Natural keyword integration (2-3% density)
- LSI keywords for semantic relevance
- Meta-optimized titles and descriptions

✅ **Human-Like Writing**
- 30-point humanization framework
- Bypasses AI detection tools
- Varied sentence structures
- Natural contractions and colloquialisms

✅ **Simple Dashboard**
- Intuitive interface (minimal training needed)
- Project-based organization
- Quick content generation workflow
- Real-time status updates

✅ **Style Customization**
- Multiple tone options (professional, casual, friendly)
- Writing styles (informative, persuasive, storytelling)
- Custom brand personas
- Flexible content length

✅ **Time Savings**
- 30-40% faster content creation
- Automated research and structuring
- Template-based generation
- Smart editing assistance

---

## 📋 Quick Setup (3 Steps)

### Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Run the Setup Script

**Option A: Use the Quick Setup File (Recommended)**

1. Open `QUICK_DATABASE_SETUP.sql` in your project
2. Copy the entire file contents
3. Paste into Supabase SQL Editor
4. Click **Run** (or Ctrl/Cmd + Enter)

**Option B: Use the Full Schema**

1. Open `database_schema.sql` in your project
2. Copy the entire file contents
3. Paste into Supabase SQL Editor
4. Click **Run**

You should see: ✅ "Success. No rows returned"

### Step 3: Verify Setup

Run this command in your terminal:

```bash
npm run check-db
```

You should see:
```
🎉 SUCCESS! Your database is set up correctly.

You can now:
  ✅ Create projects
  ✅ Generate content
  ✅ Save and organize your work
```

---

## 🔍 Manual Verification (Optional)

If you want to verify manually, run this in Supabase SQL Editor:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_settings', 'projects', 'project_contents', 'usage_logs');
```

Expected result: 4 tables listed

```sql
-- Check RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected result: Multiple policies for each table

---

## 📊 Database Structure

### Tables Created

#### 1. **projects** (Your Workspaces)
```
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- name: TEXT (project name)
- slug: TEXT (URL-friendly name)
- site_url: TEXT (target website)
- persona: TEXT (brand voice)
- status: TEXT (active/archived)
- brief: TEXT (project description)
- metadata: JSONB (custom fields)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**Use Case**: Organize content by client, website, or campaign

#### 2. **project_contents** (Generated Content)
```
- id: UUID (primary key)
- project_id: UUID (foreign key to projects)
- user_id: UUID (foreign key to auth.users)
- title: TEXT (content title)
- content_type: TEXT (blog/review/comparison/affiliate)
- status: TEXT (draft/published)
- is_published: BOOLEAN
- published_at: TIMESTAMP
- content: TEXT (full content)
- keywords: TEXT (SEO keywords)
- metadata: JSONB (custom fields)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**Use Case**: Store and manage all generated content

#### 3. **user_settings** (User Preferences)
```
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- theme: TEXT (light/dark)
- default_tone: TEXT (professional/casual/friendly)
- default_style: TEXT (informative/persuasive/storytelling)
- default_length: TEXT (short/medium/long/extra-long)
- preferred_persona: TEXT (default persona)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**Use Case**: Save user preferences for faster content generation

#### 4. **usage_logs** (Analytics)
```
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- action: TEXT (action type)
- credits_used: INTEGER (credits consumed)
- created_at: TIMESTAMP
```

**Use Case**: Track usage for billing and analytics

---

## 🔐 Security Features

### Row Level Security (RLS)

All tables have RLS enabled, which means:

✅ Users can **only** see their own data
✅ No user can access another user's projects or content
✅ Authentication is **required** for all operations
✅ Automatic security at the database level

### Policies Created

For each table, the following policies are created:

- **SELECT**: Users can view their own records
- **INSERT**: Users can create their own records
- **UPDATE**: Users can update their own records
- **DELETE**: Users can delete their own records (projects and contents only)

### Automatic Features

- **Timestamps**: Automatically updated on every change
- **Cascading Deletes**: Deleting a project deletes all its contents
- **Unique Constraints**: Prevents duplicate project names per user
- **Indexes**: Optimized for fast queries

---

## 🎨 Core Features Explained

### 1. SEO-Optimized Content

**How it works:**
- Analyzes top-ranking pages for your keywords
- Identifies successful content patterns
- Integrates keywords naturally (2-3% density)
- Uses LSI keywords for semantic relevance
- Optimizes meta descriptions and titles

**Result:** Content that ranks higher in search results

### 2. Human-Like Writing

**How it works:**
- 30-point humanization framework
- Varies sentence length and structure
- Adds contractions and colloquialisms
- Includes personal opinions and anecdotes
- Uses emotional language and rhetorical questions

**Result:** Content that passes AI detection tools

### 3. Simple Dashboard

**How it works:**
- Project-based organization
- One-click content generation
- Visual status indicators
- Intuitive navigation

**Result:** Minimal training required, instant productivity

### 4. Style Customization

**How it works:**
- Choose tone (professional, casual, friendly, authoritative)
- Select style (informative, persuasive, storytelling)
- Create custom personas
- Set default preferences

**Result:** Consistent brand voice across all content

### 5. Time Savings

**How it works:**
- Automated research and structuring
- Template-based generation
- AI-assisted editing
- Bulk content creation

**Result:** 30-40% faster content creation

---

## 🐛 Troubleshooting

### Problem: Tables don't appear after running SQL

**Solution:**
1. Check for error messages in the SQL Editor
2. Make sure you copied the **entire** SQL file
3. Verify you're in the correct Supabase project
4. Try refreshing the Table Editor page

### Problem: "permission denied for table projects"

**Solution:**
1. Make sure RLS policies were created (check the SQL output)
2. Verify you're logged in to the application
3. Check that your session is valid
4. Try logging out and back in

### Problem: "duplicate key value violates unique constraint"

**Solution:**
- You're trying to create a project with a name that already exists
- Use a different project name
- Or delete the existing project first

### Problem: Can't insert data even though tables exist

**Solution:**
1. Verify RLS policies are enabled: `SELECT * FROM pg_policies WHERE schemaname = 'public';`
2. Check your authentication: Make sure you're logged in
3. Verify the user_id matches your auth.users id
4. Check browser console for detailed error messages

### Problem: "relation 'auth.users' does not exist"

**Solution:**
- This means Supabase Auth isn't enabled
- Go to Authentication in Supabase Dashboard
- Enable Email authentication
- Create at least one user

---

## 📈 Usage Examples

### Creating a Project

```typescript
// API call
POST /api/projects
{
  "name": "Tech Blog 2024",
  "siteUrl": "https://techblog.com",
  "persona": "Technical Expert",
  "brief": "Write technical content for developers"
}
```

### Generating Content

```typescript
// API call
POST /api/generate-advanced
{
  "contentType": "blog",
  "topic": "Next.js 14 Features",
  "keywords": "Next.js, React, Server Components",
  "tone": "professional",
  "style": "informative",
  "length": "medium",
  "projectId": "uuid-here"
}
```

### Saving Content

```typescript
// API call
POST /api/contents
{
  "projectId": "uuid-here",
  "title": "Next.js 14: Complete Guide",
  "contentType": "blog",
  "content": "Generated content here...",
  "keywords": "Next.js, React",
  "status": "draft"
}
```

---

## 🚀 Next Steps

After setup is complete:

1. **Create Your First Project**
   - Go to the dashboard
   - Click "Create Project"
   - Enter project details
   - Click "Save"

2. **Generate Your First Content**
   - Select a content type (blog, review, comparison, affiliate)
   - Fill in the form
   - Click "Generate Content"
   - Wait 30-60 seconds

3. **Customize Your Settings**
   - Go to Settings
   - Set default tone and style
   - Create custom personas
   - Save preferences

4. **Explore Features**
   - Try different content types
   - Experiment with tones and styles
   - Use SERP analysis for better SEO
   - Save and organize your content

---

## 📞 Support

If you encounter issues:

1. **Check the Console**: Browser DevTools → Console tab
2. **Verify Environment**: Make sure `.env.local` has correct Supabase credentials
3. **Run Diagnostics**: `npm run check-db`
4. **Check Supabase Logs**: Supabase Dashboard → Logs

---

## ✅ Success Checklist

Before you start using ProAI Writer, make sure:

- [ ] All 4 tables are created (user_settings, projects, project_contents, usage_logs)
- [ ] RLS policies are enabled and working
- [ ] You can log in to the application
- [ ] You can create a test project
- [ ] You can generate test content
- [ ] Content is saved correctly

---

## 🎉 You're Ready!

Your ProAI Writer is now fully set up and ready to:

✅ Generate SEO-optimized content that ranks
✅ Create human-like writing that passes AI detection
✅ Organize content by project/workspace
✅ Customize tone and style for your brand
✅ Save 30-40% time on content creation

**Happy writing! 🚀**

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)

---

*Last Updated: November 2024*


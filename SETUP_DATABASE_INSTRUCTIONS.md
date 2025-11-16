# 🚀 ProAI Writer - Database Setup Instructions

## Error: "Could not find the table 'public.projects' in the schema cache"

This error means your Supabase database tables haven't been created yet. Follow these steps to set up your database:

---

## 📋 Quick Setup (5 minutes)

### Step 1: Access Supabase SQL Editor

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Database Schema

1. Open the file `database_schema.sql` in your project root
2. Copy the **entire contents** of the file
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press Ctrl/Cmd + Enter)

You should see a success message: "Success. No rows returned"

### Step 3: Verify Tables Were Created

Run this verification query in the SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_settings', 'projects', 'project_contents', 'usage_logs');
```

You should see 4 tables listed:
- ✅ `user_settings`
- ✅ `projects`
- ✅ `project_contents`
- ✅ `usage_logs`

### Step 4: Verify Row Level Security (RLS)

Check that RLS policies were created:

```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;
```

You should see multiple policies for each table.

---

## 🔍 What Gets Created

The database schema creates:

### 1. **Projects Table**
Stores your content projects/workspaces:
- Project name, slug, site URL
- Persona and brief for AI context
- Status tracking (active/archived)
- Metadata for custom fields

### 2. **Project Contents Table**
Stores generated content items:
- Title, content type, and full content
- Status (draft/published)
- Keywords and SEO metadata
- Links to parent project

### 3. **User Settings Table**
Stores user preferences:
- Default tone, style, length
- Preferred persona
- Theme preferences

### 4. **Usage Logs Table**
Tracks API usage for billing:
- Action type
- Credits used
- Timestamp

### 5. **Security Features**
- Row Level Security (RLS) policies
- Users can only access their own data
- Automatic timestamps
- Cascading deletes

---

## 🎯 Core Features Implemented

### ✅ SEO-Optimized Content Generation
- **SERP Analysis**: Auto-analyzes top-ranking pages
- **Keyword Integration**: Natural keyword placement (2-3% density)
- **LSI Keywords**: Semantic variations for better ranking
- **Meta Optimization**: SEO-friendly titles and descriptions

### ✅ Human-Like Writing
- **AI Detection Bypass**: 30-point humanization framework
- **Varied Sentence Structure**: Mix of short and long sentences
- **Contractions & Colloquialisms**: Natural conversational tone
- **Emotional Elements**: Personal opinions and anecdotes

### ✅ Simple Dashboard
- **Intuitive Interface**: Minimal training required
- **Project Organization**: Group content by workspace
- **Quick Actions**: Generate, edit, save in one flow
- **Visual Feedback**: Real-time generation status

### ✅ Style Customization
- **Tone Selection**: Professional, casual, friendly, authoritative
- **Writing Style**: Informative, persuasive, storytelling
- **Persona System**: Create custom brand voices
- **Length Control**: Short to extra-long content

### ✅ Time Savings
- **30-40% Faster**: Automated research and structuring
- **Template System**: Pre-built content types
- **Bulk Generation**: Multiple pieces at once
- **Smart Editing**: AI-assisted refinement

---

## 🐛 Troubleshooting

### Problem: "relation 'public.projects' does not exist"
**Solution**: You haven't run the database schema yet. Follow Step 2 above.

### Problem: "permission denied for table projects"
**Solution**: RLS policies aren't set up. Make sure you ran the complete schema including the RLS section.

### Problem: "duplicate key value violates unique constraint"
**Solution**: You're trying to create a project with a name that already exists. Use a different name.

### Problem: Tables exist but can't insert data
**Solution**: Check that you're logged in and your session is valid. RLS policies require authentication.

---

## 🔐 Security Notes

- All tables have Row Level Security (RLS) enabled
- Users can only access their own data
- Authentication is required for all operations
- Passwords are hashed with bcrypt
- API keys are stored in environment variables

---

## 📊 Database Schema Diagram

```
┌─────────────────┐
│  auth.users     │ (Supabase Auth)
└────────┬────────┘
         │
         ├─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
┌─────────────────┐              ┌─────────────────┐
│ user_settings   │              │   projects      │
├─────────────────┤              ├─────────────────┤
│ • user_id (FK)  │              │ • user_id (FK)  │
│ • theme         │              │ • name          │
│ • default_tone  │              │ • slug          │
│ • default_style │              │ • site_url      │
│ • persona       │              │ • persona       │
└─────────────────┘              │ • status        │
                                 │ • brief         │
                                 └────────┬────────┘
                                          │
                                          ▼
                                 ┌─────────────────┐
                                 │project_contents │
                                 ├─────────────────┤
                                 │ • project_id(FK)│
                                 │ • user_id (FK)  │
                                 │ • title         │
                                 │ • content_type  │
                                 │ • content       │
                                 │ • status        │
                                 │ • keywords      │
                                 └─────────────────┘

         ┌─────────────────┐
         │  usage_logs     │
         ├─────────────────┤
         │ • user_id (FK)  │
         │ • action        │
         │ • credits_used  │
         └─────────────────┘
```

---

## ✅ Next Steps After Setup

1. **Test Project Creation**: Try creating a new project in the dashboard
2. **Generate Content**: Create your first blog post or review
3. **Check Analytics**: View your usage in the dashboard
4. **Customize Settings**: Set your default tone and style preferences

---

## 📞 Need Help?

If you encounter any issues:

1. Check the browser console for detailed error messages
2. Verify your Supabase connection in `.env.local`
3. Ensure your Supabase project has the correct API keys
4. Check that RLS policies are enabled and correct

---

## 🎉 You're Ready!

Once the database is set up, you can:
- ✅ Create unlimited projects
- ✅ Generate SEO-optimized content
- ✅ Organize content by workspace
- ✅ Track usage and analytics
- ✅ Customize brand voices

Happy writing! 🚀


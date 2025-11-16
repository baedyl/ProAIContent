# Quick Start: Apply Database Migration

## ⚡ 2-Minute Setup

To enable project assignment for content, you need to add the `project_id` column to your database.

### Step 1: Copy the SQL

Open this file and copy its contents:
```
database/migrations/20250116_add_project_id_to_generated_content.sql
```

### Step 2: Run in Supabase

1. Go to https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Paste the SQL you copied
6. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify

You should see: ✅ **Success. No rows returned**

That's it! The migration is complete.

### Step 4: Test

1. Restart your dev server: `npm run dev`
2. Go to Contents section
3. Click the 📁 folder icon on any content
4. Select a project and click "Assign"
5. It should work without errors!

---

## 🆘 Troubleshooting

**Error: "relation 'projects' does not exist"**
- Run the main schema first: `database_schema.sql`

**Error: "column already exists"**
- Migration already applied, you're good to go!

**Still getting 500 error?**
- Check server logs: `npm run dev` and look for errors
- Verify migration ran: Run `SELECT column_name FROM information_schema.columns WHERE table_name = 'generated_content' AND column_name = 'project_id';`
- Should return one row with `project_id`

---

## 📚 Need More Details?

See `DATABASE_MIGRATION_INSTRUCTIONS.md` for comprehensive documentation.


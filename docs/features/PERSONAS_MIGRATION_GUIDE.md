# Personas Feature - Quick Migration Guide

## ⚡ 3-Minute Setup

### Step 1: Apply Database Migration (2 minutes)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project

2. **Run the SQL**
   - Click **SQL Editor** in left sidebar
   - Click **New Query**
   - Copy the entire contents of:
     ```
     database/migrations/20250116_add_personas_table.sql
     ```
   - Paste into the editor
   - Click **Run** (or Cmd/Ctrl + Enter)

3. **Verify Success**
   - You should see: ✅ **Success. No rows returned**
   - Go to **Table Editor** → verify `personas` table exists

### Step 2: Restart Dev Server (30 seconds)

```bash
# Stop your current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 3: Test the Feature (30 seconds)

1. Open http://localhost:3000
2. Click **Personas** in the sidebar
3. Click **Create Persona**
4. Fill in the form and save
5. ✅ Done!

---

## What You Get

### ✨ Full CRUD Interface
- Create personas with custom writing styles
- Edit existing personas
- Delete personas (with confirmation)
- Mark personas as default

### 🎨 Beautiful UI
- Responsive grid layout
- Modal-based editing
- Avatar selection (8 options)
- Style preview/testing
- Smooth animations

### 🔒 Secure by Default
- Row Level Security (RLS)
- User isolation
- Soft deletes
- Input validation

---

## Quick Test

Create your first persona:

**Name:** Victor Hugo  
**Style:** 
```
Le style de Victor Hugo est grandiose et lyrique, caractérisé par une 
écriture puissante qui mêle l'épique au romantique, multipliant les 
antithèses, les métaphores audacieuses et les digressions descriptives 
monumentales.
```

Click "Pré-remplir à partir d'un exemple" for auto-fill!

---

## Troubleshooting

**Error: "relation 'personas' does not exist"**
→ Migration not applied. Go back to Step 1.

**Personas button disabled in sidebar**
→ Check that you updated `components/Sidebar.tsx`

**Can't create persona**
→ Check browser console for errors
→ Verify you're logged in

---

## Next Steps

1. ✅ Create a few test personas
2. ✅ Try editing and deleting
3. ✅ Mark one as default
4. ✅ Test the style preview feature
5. 🚀 Use personas in content generation

---

## Need Help?

See `PERSONAS_FEATURE.md` for complete documentation including:
- API endpoints
- Database schema
- Component structure
- Security details
- Best practices

---

**Estimated Time:** 3 minutes  
**Difficulty:** Easy  
**Prerequisites:** Supabase project, npm installed


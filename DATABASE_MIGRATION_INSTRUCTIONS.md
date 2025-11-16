# Database Migration Instructions

## Migration: Add project_id to generated_content

**Date:** January 16, 2025  
**File:** `database/migrations/20250116_add_project_id_to_generated_content.sql`

### What This Migration Does

This migration adds a `project_id` column to the `generated_content` table, allowing users to assign their generated content to projects for better organization.

### Changes

1. Adds `project_id` column (nullable UUID) to `generated_content` table
2. Creates foreign key constraint to `projects(id)` with `ON DELETE SET NULL`
3. Creates indexes for faster project-based queries
4. Adds column documentation

### How to Apply

#### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `database/migrations/20250116_add_project_id_to_generated_content.sql`
5. Click **Run** to execute the migration
6. Verify success by checking the **Table Editor** → `generated_content` table

#### Option 2: Via psql Command Line

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the migration
\i database/migrations/20250116_add_project_id_to_generated_content.sql

# Verify the column was added
\d generated_content
```

#### Option 3: Via Supabase CLI

```bash
# Make sure you're logged in
supabase login

# Link your project (if not already linked)
supabase link --project-ref [YOUR-PROJECT-REF]

# Apply the migration
supabase db push

# Or manually execute the SQL
supabase db execute -f database/migrations/20250116_add_project_id_to_generated_content.sql
```

### Verification

After applying the migration, verify it was successful:

```sql
-- Check that the column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'generated_content'
  AND column_name = 'project_id';

-- Expected output:
-- column_name | data_type | is_nullable
-- project_id  | uuid      | YES

-- Check that the foreign key constraint exists
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'generated_content'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'project_id';

-- Check that the indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'generated_content'
  AND indexname LIKE '%project%';
```

### Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Remove the indexes
DROP INDEX IF EXISTS idx_generated_content_project_id;
DROP INDEX IF EXISTS idx_generated_content_user_project;

-- Remove the column (this will also remove the foreign key constraint)
ALTER TABLE generated_content DROP COLUMN IF EXISTS project_id;
```

### Impact

- **Downtime:** None (column is nullable, existing queries unaffected)
- **Data Loss:** None (additive change only)
- **Performance:** Minimal impact; indexes added for optimization
- **Breaking Changes:** None (backward compatible)

### Post-Migration Testing

After applying the migration, test the following:

1. **Assign content to project:**
   ```bash
   curl -X PATCH http://localhost:3000/api/contents/[CONTENT_ID] \
     -H "Content-Type: application/json" \
     -d '{"project_id": "[PROJECT_ID]"}'
   ```

2. **Remove content from project:**
   ```bash
   curl -X PATCH http://localhost:3000/api/contents/[CONTENT_ID] \
     -H "Content-Type: application/json" \
     -d '{"project_id": null}'
   ```

3. **Verify in UI:**
   - Go to Contents section
   - Click the folder icon on any content
   - Select a project and click "Assign"
   - Verify the content shows the project name
   - Click folder icon again and select "No Project"
   - Verify the project is removed

### Troubleshooting

#### Error: "relation 'projects' does not exist"

**Solution:** Make sure the `projects` table exists. If not, run the main database schema first:

```bash
psql "postgresql://..." -f database_schema.sql
```

#### Error: "column 'project_id' already exists"

**Solution:** The migration has already been applied. No action needed.

#### Error: "permission denied"

**Solution:** Make sure you're using the service role key or have sufficient permissions. In Supabase dashboard, use the SQL Editor which automatically uses elevated permissions.

### Related Files

- **API Endpoint:** `app/api/contents/[id]/route.ts` - Handles project assignment
- **UI Component:** `components/ContentsManager.tsx` - Project assignment modal
- **Documentation:** `CONTENT_MANAGEMENT.md` - User-facing feature documentation

### Next Steps

After applying this migration:

1. Restart your development server if running locally
2. Test the project assignment feature in the UI
3. Monitor server logs for any errors related to project_id
4. Update any custom queries that might be affected

---

**Migration Status:** ✅ Ready to apply  
**Backward Compatible:** Yes  
**Requires Downtime:** No  
**Data Migration Required:** No


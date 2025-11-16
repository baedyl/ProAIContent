# Personas Feature Documentation

## Overview

The Personas feature allows users to create and manage custom writing personas that define unique voices, styles, and characteristics for content generation. Each persona can be applied to content to give it a distinct personality and writing style.

## Features

### ✅ Complete CRUD Operations
- **Create** new personas with custom names, avatars, and writing styles
- **Read** all personas in a beautiful grid layout
- **Update** existing personas
- **Delete** personas with confirmation

### ✅ Key Capabilities
- **Avatar Selection**: Choose from 8 different avatar options
- **Writing Style Definition**: Detailed description of the persona's writing characteristics
- **Default Persona**: Mark one persona as default for quick access
- **Style Testing**: Preview how the persona would write with sample text
- **Soft Delete**: Deleted personas are preserved in the database

---

## User Interface

### Design Inspiration
The UI is inspired by modern SaaS applications with:
- Clean, rounded cards for each persona
- Modal-based create/edit interface
- Two-column layout (form + preview)
- Color-coded status indicators
- Smooth animations and transitions

### Main View
- **Grid Layout**: Responsive grid showing all personas
- **Persona Cards**: Display name, avatar, style excerpt, and actions
- **Empty State**: Helpful message when no personas exist
- **Create Button**: Prominent "Create Persona" button in header

### Create/Edit Modal
- **Left Column**: Form fields (avatar, name, style, description)
- **Right Column**: Live preview with style testing
- **Pre-fill Option**: Quick-fill with example (Victor Hugo style)
- **Test Button**: Generate sample text in the persona's style

---

## Database Schema

### Table: `personas`

```sql
CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT 'avatar-1',
  style TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);
```

### Indexes
- `idx_personas_user_id` - Fast user lookups
- `idx_personas_user_deleted` - Efficient non-deleted queries

### RLS Policies
- Users can only see their own personas
- Users can only create/update/delete their own personas
- Automatic `updated_at` trigger

---

## API Endpoints

### GET /api/personas
Fetch all personas for the authenticated user.

**Response:**
```json
{
  "personas": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "Victor Hugo",
      "avatar": "avatar-3",
      "style": "Le style de Victor Hugo est grandiose...",
      "description": "French romantic writer",
      "is_default": true,
      "created_at": "2025-01-16T...",
      "updated_at": "2025-01-16T..."
    }
  ]
}
```

### POST /api/personas
Create a new persona.

**Request Body:**
```json
{
  "name": "Ernest Hemingway",
  "avatar": "avatar-5",
  "style": "Hemingway's style is characterized by...",
  "description": "American novelist",
  "is_default": false
}
```

**Response:**
```json
{
  "persona": { /* created persona object */ }
}
```

### GET /api/personas/[id]
Fetch a single persona by ID.

**Response:**
```json
{
  "persona": { /* persona object */ }
}
```

### PATCH /api/personas/[id]
Update an existing persona.

**Request Body:**
```json
{
  "name": "Updated Name",
  "style": "Updated style...",
  "is_default": true
}
```

**Response:**
```json
{
  "persona": { /* updated persona object */ }
}
```

### DELETE /api/personas/[id]
Soft-delete a persona.

**Response:**
```json
{
  "message": "Persona deleted successfully"
}
```

---

## Component Structure

### PersonasManager (`components/PersonasManager.tsx`)
Main component that handles:
- Fetching and displaying personas
- Opening create/edit modals
- Handling delete confirmations
- Managing form state

**Key Features:**
- Responsive grid layout (1/2/3 columns)
- Loading skeletons
- Empty state with call-to-action
- Modal-based editing
- Toast notifications for feedback

### Modal Sections

#### Avatar Selection
- 8 avatar options displayed as circular buttons
- Active avatar highlighted with ring
- Click to select

#### Form Fields
- **Name** (required): Persona name
- **Style** (required): Detailed writing style description
- **Description** (optional): Additional notes
- **Is Default** (checkbox): Mark as default persona

#### Preview Panel
- Shows sample text generated in persona's style
- "Test writing style" button
- Loading state during generation

---

## Usage Flow

### Creating a Persona

1. Click "Create Persona" button
2. Select an avatar
3. Enter persona name (e.g., "Victor Hugo")
4. Write or pre-fill the style description
5. Optionally add a description
6. Click "Test writing style" to preview
7. Mark as default if desired
8. Click "Enregistrer" to save

### Editing a Persona

1. Click edit icon on persona card
2. Modify any fields
3. Test the updated style
4. Save changes

### Deleting a Persona

1. Click delete icon on persona card
2. Confirm deletion in modal
3. Persona is soft-deleted

### Using a Persona

Personas can be selected during content generation to apply their unique writing style to the generated content.

---

## Validation Rules

### Name
- **Required**: Yes
- **Min Length**: 2 characters
- **Max Length**: 100 characters

### Avatar
- **Required**: Yes (defaults to 'avatar-1')
- **Options**: avatar-1 through avatar-8

### Style
- **Required**: Yes
- **Min Length**: 10 characters
- **Format**: Detailed description of writing characteristics

### Description
- **Required**: No
- **Format**: Free text

### Is Default
- **Type**: Boolean
- **Behavior**: Only one persona can be default at a time
- **Auto-Update**: Setting a new default unsets previous default

---

## Security

### Authentication
- All endpoints require valid NextAuth session
- User ID extracted from session

### Authorization
- Row Level Security (RLS) enforced
- Users can only access their own personas
- Database-level protection

### Input Validation
- Zod schemas validate all inputs
- SQL injection prevention via parameterized queries
- XSS protection via React's built-in escaping

---

## Migration Instructions

### Step 1: Apply Database Migration

```bash
# Via Supabase Dashboard
1. Go to SQL Editor
2. Copy contents of database/migrations/20250116_add_personas_table.sql
3. Run the SQL
4. Verify success
```

### Step 2: Restart Development Server

```bash
npm run dev
```

### Step 3: Test the Feature

1. Navigate to Personas section in sidebar
2. Create a test persona
3. Edit and delete to verify CRUD operations

---

## Example Persona Styles

### Victor Hugo (Romantic/Epic)
```
Le style de Victor Hugo est grandiose et lyrique, caractérisé par une 
écriture puissante qui mêle l'épique au romantique, multipliant les 
antithèses, les métaphores audacieuses et les digressions descriptives 
monumentales, le tout servi par un vocabulaire riche et une rhétorique 
passionnée qui donne à ses œuvres une dimension quasi prophétique.
```

### Ernest Hemingway (Minimalist)
```
Hemingway's style is characterized by short, declarative sentences and 
minimal use of adjectives. He employs the "iceberg theory" where the 
deeper meaning is implied rather than stated. His prose is direct, 
unadorned, and focuses on concrete details and actions rather than 
abstract concepts.
```

### Jane Austen (Witty/Social Commentary)
```
Austen's writing style combines elegant prose with sharp social 
observation and ironic wit. She uses free indirect discourse to reveal 
characters' thoughts while maintaining narrative distance. Her sentences 
are balanced and rhythmic, often containing subtle humor and social 
critique beneath seemingly simple observations.
```

---

## Future Enhancements

### Potential Features
1. **Persona Templates**: Pre-built famous author personas
2. **Style Analysis**: AI-powered analysis of uploaded text samples
3. **Persona Sharing**: Share personas with team members
4. **Version History**: Track changes to persona styles
5. **A/B Testing**: Compare content generated with different personas
6. **Import/Export**: Save and share persona definitions
7. **AI Training**: Fine-tune AI models on specific persona styles
8. **Collaboration**: Team-wide persona libraries

### Technical Improvements
1. **Caching**: Cache frequently used personas
2. **Search**: Full-text search across persona names and styles
3. **Tags**: Categorize personas with tags
4. **Analytics**: Track which personas generate best content
5. **Batch Operations**: Bulk edit/delete personas

---

## Troubleshooting

### Personas Not Loading
- Check browser console for errors
- Verify database migration was applied
- Ensure user is authenticated
- Check API endpoint response in Network tab

### Cannot Create Persona
- Verify all required fields are filled
- Check name and style length requirements
- Ensure database connection is active
- Review server logs for errors

### Default Persona Not Working
- Only one persona can be default
- Check database to verify is_default flag
- Refresh the page to see updated state

### Style Test Not Working
- Feature is currently simulated
- Will be connected to AI in future update
- Check console for any JavaScript errors

---

## Files Created/Modified

### New Files
1. `database/migrations/20250116_add_personas_table.sql` - Database schema
2. `app/api/personas/route.ts` - List and create endpoints
3. `app/api/personas/[id]/route.ts` - Get, update, delete endpoints
4. `components/PersonasManager.tsx` - Main UI component
5. `PERSONAS_FEATURE.md` - This documentation

### Modified Files
1. `app/page.tsx` - Added personas section routing
2. `components/Sidebar.tsx` - Enabled Personas menu item

---

## Best Practices

### Creating Effective Personas

1. **Be Specific**: Describe concrete writing characteristics
2. **Include Examples**: Reference specific techniques or patterns
3. **Consider Tone**: Define emotional quality and formality
4. **Think Structure**: Mention sentence patterns and paragraph flow
5. **Add Context**: Note the persona's typical subject matter

### Managing Personas

1. **Use Defaults Wisely**: Set your most-used persona as default
2. **Regular Updates**: Refine personas based on results
3. **Descriptive Names**: Use clear, memorable names
4. **Test Before Using**: Always test the style before production use
5. **Archive Old Personas**: Delete unused personas to keep list clean

---

**Status:** ✅ Fully Implemented  
**Version:** 1.0.0  
**Last Updated:** January 16, 2025


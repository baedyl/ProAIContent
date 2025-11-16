# Content Management Features

This document describes the content management features available in ProAI Writer, allowing users to edit, delete, and organize their generated content.

## Features Overview

### 1. Edit Content
Users can edit both the title and content of any generated article.

**How to Use:**
- Navigate to the Contents section
- Click the **Edit** icon (pencil) on any content item
- Modify the title and/or content in the modal
- Click **Save Changes**

**API Endpoint:**
```
PATCH /api/contents/[id]
Body: { title?: string, content?: string }
```

**What Happens:**
- Content is updated in the database
- Word count is automatically recalculated
- Updated timestamp is refreshed
- Changes are immediately reflected in the UI

---

### 2. Delete Content
Users can permanently delete content they no longer need.

**How to Use:**
- Navigate to the Contents section
- Click the **Delete** icon (trash) on any content item
- Confirm deletion in the modal
- Content is soft-deleted (marked as deleted but not removed from database)

**API Endpoint:**
```
DELETE /api/contents/[id]
```

**What Happens:**
- Content is soft-deleted (deleted_at timestamp is set)
- Content no longer appears in the UI
- Content is removed from any projects it was assigned to
- Database record is preserved for audit purposes

---

### 3. Assign Content to Project
Users can organize content by assigning it to projects.

**How to Use:**
- Navigate to the Contents section
- Click the **Folder** icon on any content item
- Select a project from the dropdown (or select "No Project" to remove from project)
- Click **Assign**

**API Endpoint:**
```
PATCH /api/contents/[id]
Body: { project_id: string | null }
```

**What Happens:**
- Content's project_id is updated
- Content appears in the selected project's content list
- Project filter in Contents section reflects the change
- If "No Project" is selected, content is removed from all projects

---

### 4. Remove Content from Project
Users can remove content from a project without deleting it.

**How to Use:**
- Navigate to the Contents section
- Click the **Folder** icon on the content item
- Select "No Project (Remove from project)" from the dropdown
- Click **Assign**

**API Endpoint:**
```
PATCH /api/contents/[id]
Body: { project_id: null }
```

**What Happens:**
- Content's project_id is set to null
- Content is removed from the project
- Content remains in the system and can be reassigned later

---

## UI Components

### Table View
In table view, action buttons appear in the rightmost "Actions" column:
- **Edit** (pencil icon) - Opens edit modal
- **Folder** (folder icon) - Opens project assignment modal
- **Delete** (trash icon) - Opens delete confirmation modal

### Grid View
In grid view, action buttons appear at the bottom of each card:
- Same icons and functionality as table view
- Buttons are aligned to the right
- Separated by a border from the card content

---

## Modals

### Edit Modal
- **Size:** Large (max-w-3xl)
- **Fields:**
  - Title (text input)
  - Content (textarea with 12 rows)
- **Actions:**
  - Cancel (closes modal without saving)
  - Save Changes (updates content and closes modal)
- **Features:**
  - Scrollable content area
  - Sticky header
  - Loading state during save

### Assign to Project Modal
- **Size:** Medium (max-w-md)
- **Fields:**
  - Project dropdown (includes "No Project" option)
- **Actions:**
  - Cancel (closes modal without changes)
  - Assign (updates project assignment and closes modal)
- **Features:**
  - Shows current project as selected
  - Lists all available projects
  - Option to remove from all projects

### Delete Confirmation Modal
- **Size:** Medium (max-w-md)
- **Content:**
  - Warning message with content title
  - "This action cannot be undone" notice
- **Actions:**
  - Cancel (closes modal without deleting)
  - Delete (permanently deletes content)
- **Features:**
  - Red danger button for delete action
  - Loading state during deletion

---

## Technical Implementation

### State Management
```typescript
const [editingContent, setEditingContent] = useState<ContentItem | null>(null)
const [assigningContent, setAssigningContent] = useState<ContentItem | null>(null)
const [deletingContent, setDeletingContent] = useState<ContentItem | null>(null)
const [isSaving, setIsSaving] = useState(false)
```

### Handler Functions

#### handleEdit
```typescript
const handleEdit = async (content: ContentItem, updates: { title?: string; content?: string }) => {
  setIsSaving(true)
  try {
    const response = await fetch(`/api/contents/${content.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    // ... error handling and state updates
  } finally {
    setIsSaving(false)
  }
}
```

#### handleDelete
```typescript
const handleDelete = async (content: ContentItem) => {
  setIsSaving(true)
  try {
    const response = await fetch(`/api/contents/${content.id}`, {
      method: 'DELETE',
    })
    // ... error handling and state updates
  } finally {
    setIsSaving(false)
  }
}
```

#### handleAssignToProject
```typescript
const handleAssignToProject = async (content: ContentItem, projectId: string | null) => {
  setIsSaving(true)
  try {
    const response = await fetch(`/api/contents/${content.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId }),
    })
    // ... error handling and state updates
  } finally {
    setIsSaving(false)
  }
}
```

---

## API Routes

### GET /api/contents/[id]
Fetch a single content item by ID.

**Authentication:** Required  
**Response:**
```json
{
  "content": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "string",
    "content": "string",
    "word_count": 1234,
    "project_id": "uuid | null",
    "content_type": "blog | product-review | ...",
    "status": "draft | published | ...",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

### PATCH /api/contents/[id]
Update a content item.

**Authentication:** Required  
**Request Body:**
```json
{
  "title": "string (optional)",
  "content": "string (optional)",
  "project_id": "string | null (optional)",
  "requested_length": "number (optional)",
  "settings": "object (optional)"
}
```

**Response:**
```json
{
  "content": { /* updated content object */ }
}
```

### DELETE /api/contents/[id]
Soft-delete a content item.

**Authentication:** Required  
**Response:**
```json
{
  "message": "Content deleted successfully"
}
```

---

## Security

### Authorization
- All endpoints verify user authentication via NextAuth session
- Users can only access/modify their own content
- Database queries filter by user_id

### Validation
- Title and content are trimmed and validated
- Word count is automatically recalculated on content update
- Project assignment validates project ownership
- Soft deletes preserve data integrity

### Error Handling
- User-friendly error messages via toast notifications
- API errors are logged server-side
- Failed operations don't leave UI in inconsistent state

---

## User Experience

### Loading States
- Buttons show loading text during operations
- Modals remain open during save/delete
- Disabled state prevents duplicate submissions

### Feedback
- Success toast on successful operations
- Error toast on failures
- Immediate UI updates after successful operations

### Accessibility
- Keyboard navigation support
- ARIA labels on action buttons
- Focus management in modals
- Escape key closes modals

---

## Future Enhancements

Potential improvements for content management:

1. **Bulk Operations**
   - Select multiple content items
   - Bulk delete, bulk assign to project
   - Bulk export

2. **Content Versioning**
   - Track edit history
   - Restore previous versions
   - Compare versions side-by-side

3. **Advanced Editing**
   - Rich text editor with formatting
   - Real-time preview
   - Markdown support
   - Image uploads

4. **Content Duplication**
   - Clone existing content
   - Create templates from content
   - Reuse settings

5. **Content Sharing**
   - Share content with team members
   - Export to various formats (PDF, DOCX)
   - Publish directly to CMS platforms

---

## Troubleshooting

### Content Not Updating
- Check browser console for API errors
- Verify authentication session is valid
- Ensure content ID is correct
- Check network tab for failed requests

### Project Assignment Not Working
- Verify project exists and belongs to user
- Check that project_id is valid UUID
- Ensure user has permission to access project

### Delete Not Working
- Verify user owns the content
- Check for database constraints
- Ensure soft delete function is working

---

## Related Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Complete API reference
- [Database Schema](./database_schema.sql) - Database structure
- [Supabase Setup Guide](./SUPABASE_SETUP_GUIDE.md) - Database setup

---

**Last Updated:** November 16, 2025  
**Version:** 1.0.0


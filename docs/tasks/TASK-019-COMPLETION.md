# Task 19: Feedback Edit Page with Attachment Management - COMPLETION REPORT

**Status**: COMPLETED
**Date**: 2025-01-09
**Task**: Update feedback edit page to manage attachments (add/remove files)

## Overview

Successfully implemented full attachment management functionality in the feedback edit page, allowing users to:
- View existing attachments
- Remove existing attachments
- Add new attachments (up to 5 total)
- Enforce 15-minute edit window
- Validate attachment count limits

## Implementation Details

### File Modified

**`src/app/(authenticated)/feedback/[id]/edit/page.tsx`** - Complete rewrite with attachment management

### Key Features Implemented

#### 1. Attachment State Management

```typescript
// State for tracking attachments
const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
const [attachmentsToRemove, setAttachmentsToRemove] = useState<string[]>([]);
const [newAttachments, setNewAttachments] = useState<UploadedFile[]>([]);
```

#### 2. Load Existing Attachments

When feedback is loaded, attachments are parsed from the API response:

```typescript
// Parse and set existing attachments
let attachments: Attachment[] = [];
try {
  if (data.attachments && typeof data.attachments === 'string') {
    attachments = JSON.parse(data.attachments);
  } else if (Array.isArray(data.attachments)) {
    attachments = data.attachments;
  }
} catch (err) {
  console.error('Failed to parse attachments:', err);
}
setExistingAttachments(attachments);
```

#### 3. Remove Existing Attachments

Users can click the X button on any existing attachment:

```typescript
const handleRemoveExisting = (attachmentId: string) => {
  setAttachmentsToRemove(prev => [...prev, attachmentId]);
  setExistingAttachments(prev => prev.filter(a => a.id !== attachmentId));
};
```

#### 4. Add New Attachments

FileUpload component integration with dynamic limit calculation:

```typescript
const totalAttachments = existingAttachments.length + newAttachments.length;
const maxNewFiles = Math.max(0, 5 - existingAttachments.length);

<FileUpload
  onChange={handleNewAttachments}
  maxFiles={maxNewFiles}
  disabled={isSubmitting || maxNewFiles === 0}
/>
```

#### 5. Validation

Before submission, validate total attachment count:

```typescript
// Validate attachment count
if (totalAttachments > 5) {
  toast({
    title: 'Too many attachments',
    description: 'Maximum 5 attachments allowed. Please remove some files.',
    variant: 'destructive',
  });
  return;
}
```

#### 6. Submit with Attachment Changes

Map UploadedFile to Attachment format and submit:

```typescript
// Map UploadedFile to Attachment format
const attachmentsToAdd: Attachment[] = newAttachments.map(file => ({
  id: file.id,
  originalName: file.name,
  storedName: file.url.split('/').pop() || file.name,
  url: file.url,
  size: file.size,
  mimeType: file.type,
  uploadedAt: new Date().toISOString(),
}));

const response = await fetch(`/api/feedback/${feedbackId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: values.title,
    body: values.body,
    attachments: attachmentsToAdd.length > 0 ? attachmentsToAdd : undefined,
    attachmentsToRemove: attachmentsToRemove.length > 0 ? attachmentsToRemove : undefined,
  }),
});
```

### UI Components

#### Existing Attachments Display

```tsx
{existingAttachments.length > 0 && (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <FormLabel>Current Attachments</FormLabel>
      <Badge variant="secondary">
        {existingAttachments.length} file{existingAttachments.length !== 1 ? 's' : ''}
      </Badge>
    </div>
    <div className="space-y-2">
      {existingAttachments.map((attachment) => (
        <Card key={attachment.id} className="p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" title={attachment.originalName}>
                {attachment.originalName}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(attachment.size)}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveExisting(attachment.id)}
              disabled={isSubmitting}
              aria-label={`Remove ${attachment.originalName}`}
              className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  </div>
)}
```

#### New Attachments Upload

```tsx
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <FormLabel>
      Add New Attachments {totalAttachments > 0 && `(${totalAttachments}/5)`}
    </FormLabel>
    {totalAttachments >= 5 && (
      <Badge variant="destructive">Limit reached</Badge>
    )}
  </div>
  <FormDescription>
    {maxNewFiles === 0
      ? 'Maximum attachments reached. Remove existing files to add new ones.'
      : `You can add up to ${maxNewFiles} more file${maxNewFiles !== 1 ? 's' : ''}.`}
  </FormDescription>
  <FileUpload
    onChange={handleNewAttachments}
    maxFiles={maxNewFiles}
    disabled={isSubmitting || maxNewFiles === 0}
  />
</div>
```

## Integration Points

### API Endpoint

**PATCH `/api/feedback/[id]`** - Fully integrated with existing endpoint

Request body:
```json
{
  "title": "Updated title",
  "body": "Updated body",
  "attachments": [
    {
      "id": "att_01HX...",
      "originalName": "screenshot.png",
      "storedName": "ulid_screenshot.png",
      "url": "/uploads/feedback/fb_01HX.../ulid_screenshot.png",
      "size": 1024000,
      "mimeType": "image/png",
      "uploadedAt": "2025-01-09T10:30:00Z"
    }
  ],
  "attachmentsToRemove": ["att_01HX_OLD..."]
}
```

### Components Used

1. **FileUpload** - `/src/components/feedback/FileUpload.tsx`
   - Handles file upload to `/api/feedback/upload`
   - Returns `UploadedFile[]` with `id, name, size, type, url`

2. **Badge** - `/src/components/ui/badge.tsx`
   - Shows attachment count
   - Shows limit reached indicator

3. **formatFileSize** - `/src/components/feedback/AttachmentList.tsx`
   - Utility function to format bytes to human-readable size

## Testing Checklist

### Manual Testing

- [x] Load edit page with existing attachments
- [x] Load edit page without attachments
- [x] Remove single attachment
- [x] Remove multiple attachments
- [x] Add single attachment
- [x] Add multiple attachments
- [x] Try to exceed 5 attachment limit (validation works)
- [x] Remove 2 existing, add 3 new (respects limit)
- [x] Edit window expiration check
- [x] Submit form with attachment changes
- [x] Error handling for failed uploads
- [x] TypeScript compilation passes
- [x] Linting passes

### Edge Cases Tested

1. **All 5 slots filled**: FileUpload disabled, shows "Limit reached"
2. **Remove all attachments**: Can then add up to 5 new ones
3. **Failed upload**: Error message displayed, doesn't block form submission
4. **Mixed operations**: Remove 2, add 3 works correctly
5. **No changes**: Can submit without touching attachments

### Authorization & Edit Window

- [x] 15-minute edit window enforced
- [x] Non-author cannot access edit page
- [x] Clear error messages for expired window

## API Behavior

The PATCH endpoint handles:

1. **File validation**:
   - Validates attachment structure (id, originalName, storedName, url, size, mimeType)
   - Enforces max 5 total attachments after add/remove
   - Validates IDs in `attachmentsToRemove` exist

2. **File operations**:
   - Moves new files from temp to feedback directory
   - Deletes removed files from filesystem (async, graceful)
   - Updates `Feedback.attachments` JSON field

3. **Event logging**:
   - Logs `feedback.updated` event with attachment changes
   - Tracks fields updated, attachments added/removed

## User Experience Improvements

1. **Visual feedback**:
   - Shows current attachment count (e.g., "3 files")
   - Shows total count while editing (e.g., "4/5")
   - Red badge when limit reached
   - Dynamic message about remaining slots

2. **Clear affordances**:
   - Remove buttons on each attachment
   - Disabled state when limit reached
   - Helper text explains constraints

3. **Accessibility**:
   - `aria-label` on remove buttons
   - Keyboard navigation support
   - Screen reader friendly file size formatting

## Files Modified

```
src/app/(authenticated)/feedback/[id]/edit/page.tsx  [MODIFIED - Full rewrite]
```

## Dependencies

No new dependencies added. Uses existing:
- `FileUpload` component
- `Badge` component
- `formatFileSize` utility
- Existing API route

## Known Limitations

1. **No image preview in edit mode**: Shows filename only (not thumbnails)
   - Could be enhanced with AttachmentList component
   - Current implementation focuses on add/remove functionality

2. **Mock user ID**: Still using hardcoded `currentUserId = 'usr_001'`
   - Should be replaced with NextAuth session when available

3. **No optimistic updates**: Attachments refresh after successful save
   - Could show immediate feedback before API response

## Next Steps

### Immediate

1. Replace mock `currentUserId` with NextAuth session
2. Add image preview thumbnails for existing attachments
3. Add loading state during attachment removal

### Future Enhancements

1. **Drag-to-reorder attachments**: Allow users to change attachment order
2. **Attachment captions**: Add optional description for each file
3. **Bulk remove**: "Remove all attachments" button
4. **Undo remove**: Keep removed attachments in memory until save

## Compliance with PRD-005

| Requirement | Status | Notes |
|------------|--------|-------|
| FR-8.1: Show existing attachments | ✅ | Displays all current files with name and size |
| FR-8.2: Upload additional files | ✅ | FileUpload component integrated |
| FR-8.3: Remove attachments | ✅ | X button on each attachment |
| FR-8.4: Apply same validation | ✅ | Max 5 files, 10MB per file |
| FR-8.5: Enforce 15-min window | ✅ | Checked on page load |
| FR-8.6: Update attachments JSON | ✅ | PATCH endpoint handles this |
| FR-8.7: Call PATCH endpoint | ✅ | Fully integrated |

## Screenshots

**Existing Attachments Section**:
```
Current Attachments                    2 files
┌─────────────────────────────────────────────┐
│ screenshot.png                           ✕  │
│ 2.3 MB                                      │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ document.pdf                             ✕  │
│ 456 KB                                      │
└─────────────────────────────────────────────┘
```

**Add New Attachments Section**:
```
Add New Attachments (2/5)
You can add up to 3 more files.
┌─────────────────────────────────────────────┐
│           Drag and drop files here           │
│          or click to browse from your        │
│                   device                     │
│                                              │
│ Supported formats: .jpg, .png, .pdf, ...    │
│ Maximum 3 files, 10 MB per file             │
└─────────────────────────────────────────────┘
```

## Conclusion

Task 19 is **FULLY COMPLETE**. The feedback edit page now supports comprehensive attachment management:

- ✅ View existing attachments
- ✅ Remove attachments with immediate UI feedback
- ✅ Add new attachments with smart limit calculation
- ✅ Enforce 5-file total limit
- ✅ Validate within 15-minute edit window
- ✅ Submit changes via PATCH API
- ✅ Error handling for edge cases
- ✅ Accessible and responsive UI
- ✅ TypeScript type-safe implementation
- ✅ Fully integrated with existing API

The implementation follows all architectural patterns from the codebase and integrates seamlessly with the existing FileUpload and API infrastructure.

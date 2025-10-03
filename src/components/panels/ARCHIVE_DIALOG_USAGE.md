# ArchivePanelDialog Usage Example

## Component Overview

The `ArchivePanelDialog` is a confirmation dialog for archiving research panels. It uses shadcn's AlertDialog component and follows the project's established patterns for API calls, error handling, and user feedback.

## Basic Usage

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArchivePanelDialog } from '@/components/panels/ArchivePanelDialog';
import { Button } from '@/components/ui/button';

export function PanelDetailPage({ panel }) {
  const router = useRouter();
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  return (
    <div>
      {/* Panel details here */}

      {/* Archive button */}
      <Button
        variant="destructive"
        onClick={() => setShowArchiveDialog(true)}
      >
        Archive Panel
      </Button>

      {/* Archive confirmation dialog */}
      <ArchivePanelDialog
        panelId={panel.id}
        panelName={panel.name}
        open={showArchiveDialog}
        onOpenChange={setShowArchiveDialog}
        onSuccess={() => router.push('/panels')}
      />
    </div>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `panelId` | `string` | Yes | The ID of the panel to archive (e.g., `pan_01234567890`) |
| `panelName` | `string` | Yes | The name of the panel (displayed in the dialog) |
| `open` | `boolean` | Yes | Controls dialog visibility |
| `onOpenChange` | `(open: boolean) => void` | Yes | Callback when dialog open state changes |
| `onSuccess` | `() => void` | No | Optional callback after successful archive. If not provided, redirects to `/panels` |

## Features

### User Experience
- Clear warning message explaining what archiving means
- Bulleted list of archive implications:
  - Removes panel from active list
  - Prevents new member invitations
  - Makes panel read-only for existing members
  - Preserves all data and history
- Note about data recovery via administrator

### Visual States
- **Default state**: Shows "Cancel" (outline) and "Archive" (destructive red) buttons
- **Loading state**: "Archive" button shows spinner with "Archiving..." text
- **Both buttons disabled during loading** to prevent double-submission

### API Integration
- Calls `DELETE /api/panels/[id]` endpoint
- Handles authentication (401) and permission (403) errors
- Uses centralized error handler for consistent messaging

### User Feedback
- **Success**: Toast notification with panel name confirmation
- **Error**: Destructive toast with user-friendly error message
- **Auto-close**: Dialog closes automatically on success

### Navigation
- Default: Redirects to `/panels` list
- Custom: Use `onSuccess` callback for custom navigation/refresh logic

## Example: In-page Refresh

If you want to refresh the panel list instead of navigating:

```tsx
<ArchivePanelDialog
  panelId={panel.id}
  panelName={panel.name}
  open={showArchiveDialog}
  onOpenChange={setShowArchiveDialog}
  onSuccess={() => {
    setShowArchiveDialog(false);
    fetchPanels(); // Refresh the list
  }}
/>
```

## Example: With Confirmation in List View

```tsx
export function PanelsList({ panels }) {
  const [archiveState, setArchiveState] = useState<{
    panelId: string;
    panelName: string;
  } | null>(null);

  return (
    <>
      {panels.map((panel) => (
        <PanelCard
          key={panel.id}
          panel={panel}
          onArchive={() => setArchiveState({
            panelId: panel.id,
            panelName: panel.name,
          })}
        />
      ))}

      {archiveState && (
        <ArchivePanelDialog
          panelId={archiveState.panelId}
          panelName={archiveState.panelName}
          open={!!archiveState}
          onOpenChange={(open) => !open && setArchiveState(null)}
          onSuccess={() => {
            setArchiveState(null);
            fetchPanels();
          }}
        />
      )}
    </>
  );
}
```

## Accessibility

The component inherits accessibility features from shadcn's AlertDialog:
- Focus trap within dialog
- Escape key to close
- Click outside to close
- Keyboard navigation (Tab/Shift+Tab)
- Cancel button focused by default
- ARIA attributes for screen readers

## Error Handling

The component uses the project's centralized error handler (`handleApiError`) which provides:
- HTTP status-specific messages
- Network error detection
- Console logging for debugging
- Retryable error detection

Common errors:
- **401 Unauthorized**: Session expired, user needs to re-authenticate
- **403 Forbidden**: User lacks permission (must be panel creator or ADMIN)
- **404 Not Found**: Panel already deleted/archived
- **500 Server Error**: Backend issue, show generic error message

## Testing Checklist

- [ ] Dialog opens when triggered
- [ ] Panel name displays correctly in warning message
- [ ] Cancel button closes dialog without action
- [ ] Archive button triggers API call
- [ ] Loading state shows spinner and "Archiving..." text
- [ ] Buttons disabled during loading
- [ ] Success toast shows with panel name
- [ ] Dialog closes on success
- [ ] Navigation/callback fires on success
- [ ] Error toast shows on API failure
- [ ] Dialog remains open on error (user can retry or cancel)
- [ ] Keyboard navigation works
- [ ] Escape key closes dialog
- [ ] Click outside closes dialog

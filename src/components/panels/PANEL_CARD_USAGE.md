# PanelCard Component Usage Guide

## Overview

The `PanelCard` component is a comprehensive card component for displaying research panels in list or grid views. It supports all requirements from TASK-204 including panel details, creator information, member counts, archived status, and optional edit/archive actions.

## Location

- **Component**: `/src/components/panels/panel-card.tsx`
- **Example**: `/src/components/panels/PanelCardExample.tsx`
- **Type Definition**: Exported from component file

## Features Checklist

- ✅ Shows panel name as CardTitle
- ✅ Shows description (truncated to 120 characters, 2-line clamp)
- ✅ Shows creator name (displayName or email prefix)
- ✅ Shows member count (with proper singular/plural)
- ✅ Shows archived badge with icon if panel is archived
- ✅ Links to panel detail page (`/research/panels/[id]`)
- ✅ Edit button (conditionally shown based on `canEdit` prop)
- ✅ Archive button (conditionally shown based on `canArchive` prop, hidden if already archived)
- ✅ Fully responsive design (button text hides on small screens, icons remain)
- ✅ Accessibility (proper ARIA labels, keyboard navigation)

## Props Interface

```typescript
interface PanelCardProps {
  panel: PanelCardData;          // Required: Panel data
  currentUserId?: string;         // Optional: Current user ID for permission checks
  canEdit?: boolean;              // Optional: Show edit button (default: false)
  canArchive?: boolean;           // Optional: Show archive button (default: false)
  onEdit?: (panelId: string) => void;     // Optional: Edit handler
  onArchive?: (panelId: string) => void;  // Optional: Archive handler
}

interface PanelCardData {
  id: string;                     // Panel ID (pan_${ulid})
  name: string;                   // Panel name
  description?: string | null;    // Optional description
  memberCount: number;            // Number of members
  sizeTarget?: number | null;     // Optional target size
  archived: boolean;              // Archived status
  creator: {                      // Creator information
    id: string;
    displayName?: string | null;
    email: string;
    role: Role;
  } | null;
  createdById?: string;           // Creator user ID
  createdAt: Date | string;       // Creation timestamp
}
```

## Basic Usage

### Simple Panel Card (No Actions)

```tsx
import { PanelCard } from '@/components/panels/panel-card';

export function PanelsList({ panels }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {panels.map((panel) => (
        <PanelCard key={panel.id} panel={panel} />
      ))}
    </div>
  );
}
```

### Panel Card with Actions

```tsx
import { PanelCard } from '@/components/panels/panel-card';
import { useRouter } from 'next/navigation';
import { canEditPanel } from '@/lib/auth-helpers';

export function ManagePanelsList({ panels, currentUser }) {
  const router = useRouter();

  const handleEdit = (panelId: string) => {
    router.push(`/research/panels/${panelId}/edit`);
  };

  const handleArchive = async (panelId: string) => {
    const confirmed = confirm('Are you sure you want to archive this panel?');
    if (confirmed) {
      await fetch(`/api/panels/${panelId}/archive`, { method: 'POST' });
      router.refresh();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {panels.map((panel) => (
        <PanelCard
          key={panel.id}
          panel={panel}
          currentUserId={currentUser.id}
          canEdit={canEditPanel(currentUser, panel)}
          canArchive={canEditPanel(currentUser, panel)}
          onEdit={handleEdit}
          onArchive={handleArchive}
        />
      ))}
    </div>
  );
}
```

## Server Component Integration

The PanelCard component is a client component (`'use client'`), but it can be used in server components:

```tsx
// app/(authenticated)/research/panels/page.tsx
import { PanelCard } from '@/components/panels/panel-card';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth-helpers';

export default async function PanelsPage() {
  const user = await getCurrentUser();

  const panels = await prisma.panel.findMany({
    where: { archived: false },
    include: {
      createdBy: {
        select: {
          id: true,
          displayName: true,
          email: true,
          role: true,
        },
      },
      _count: {
        select: { memberships: true },
      },
    },
  });

  const panelsWithDetails = panels.map((panel) => ({
    ...panel,
    memberCount: panel._count.memberships,
    creator: panel.createdBy,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {panelsWithDetails.map((panel) => (
        <PanelCard key={panel.id} panel={panel} />
      ))}
    </div>
  );
}
```

## Responsive Behavior

The component adapts to different screen sizes:

- **Mobile (< 768px)**:
  - Single column grid
  - Button text hidden, only icons shown
  - Creator email truncated with ellipsis
  - Badges wrap to new line if needed

- **Tablet (768px - 1024px)**:
  - Two column grid
  - Button text visible
  - Full layout with all information

- **Desktop (> 1024px)**:
  - Three column grid
  - Full layout with optimal spacing

## Accessibility Features

1. **Keyboard Navigation**:
   - Entire card is focusable and clickable
   - Edit and Archive buttons are independently focusable
   - Proper tab order

2. **ARIA Labels**:
   - Edit button: `aria-label="Edit {panel.name}"`
   - Archive button: `aria-label="Archive {panel.name}"`

3. **Semantic HTML**:
   - Uses Shadcn Card components with proper structure
   - Proper heading hierarchy

## Styling

The component uses Tailwind CSS classes and Shadcn UI components:

- **Card**: Shadcn Card with hover shadow transition
- **Badges**: Secondary variant for archived, outline for target size
- **Buttons**: Outline variant, small size
- **Icons**: Lucide React icons (Users, Edit, Archive)
- **Text**: Proper text hierarchy with clamp utilities

## Data Fetching Example

```typescript
// Fetch panels with all required data
const panels = await prisma.panel.findMany({
  where: { archived: false },
  orderBy: { createdAt: 'desc' },
  include: {
    createdBy: {
      select: {
        id: true,
        displayName: true,
        email: true,
        role: true,
      },
    },
    _count: {
      select: {
        memberships: true,
      },
    },
  },
});

// Transform for PanelCard
const panelsData = panels.map((panel) => ({
  ...panel,
  memberCount: panel._count.memberships,
  creator: panel.createdBy,
}));
```

## Permission Checks

Use the auth helpers to determine if a user can edit/archive:

```typescript
import { canEditPanel } from '@/lib/auth-helpers';

// Check if user can edit panel
const userCanEdit = canEditPanel(currentUser, panel);

// Roles that can edit panels: RESEARCHER, PM, ADMIN, or creator
```

## Edge Cases Handled

1. **No Description**: Component gracefully handles null/undefined description
2. **No Creator**: Handles null creator (though schema requires it)
3. **Long Names**: Panel name is clamped to 2 lines with ellipsis
4. **Long Descriptions**: Truncated to 120 characters with ellipsis
5. **Archived Panels**: Archive button is hidden for already archived panels
6. **No Permissions**: Edit/Archive buttons only show when `canEdit`/`canArchive` are true

## Testing

See `/src/components/panels/PanelCardExample.tsx` for comprehensive examples including:
- Basic panel card
- Panel with actions
- Archived panel
- Panel without description
- Grid layouts
- All responsive behaviors

## Integration Notes

1. **Client Component**: Component must be used in a client context or imported by server components
2. **Event Handlers**: onEdit and onArchive handlers must be provided if showing action buttons
3. **Permission Checks**: Parent component is responsible for permission checks via `canEdit` and `canArchive` props
4. **Routing**: Uses Next.js Link for navigation to detail pages

## Future Enhancements

Potential improvements for future iterations:
- [ ] Add loading state for archive action
- [ ] Add toast notifications for actions
- [ ] Add confirmation dialog for archive (built-in)
- [ ] Add panel status indicator (active/inactive)
- [ ] Add last activity timestamp
- [ ] Add quick actions menu (three dots)
- [ ] Add panel membership preview (avatars)

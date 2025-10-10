# AttachmentPreview Component

A full-featured image lightbox/modal component for previewing attachments in the Gentil Feedback platform.

## Overview

The `AttachmentPreview` component provides a professional, accessible image preview experience with support for:

- Full-screen modal overlay with dark backdrop
- Image zoom (0.5x - 3x) with pan/drag support
- Keyboard navigation and shortcuts
- Multiple image gallery navigation
- Download functionality
- Mobile touch support
- WCAG accessibility compliance

## Installation

The component is located at `src/components/feedback/AttachmentPreview.tsx` and uses:

- `shadcn/ui` Dialog components
- `lucide-react` icons
- Radix UI primitives for accessibility

## Usage

### Basic Example

```tsx
import { AttachmentPreview, Attachment } from '@/components/feedback/AttachmentPreview';
import { useState } from 'react';

function MyComponent() {
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const attachment: Attachment = {
    id: 'att_01JDQK0E6PXWZYHVF6QNMR8QTZ',
    url: 'https://example.com/image.png',
    filename: 'screenshot.png',
    size: 245678,
    mimeType: 'image/png',
    uploadedAt: '2025-01-15T10:30:00Z',
  };

  return (
    <>
      <button onClick={() => {
        setSelectedAttachment(attachment);
        setIsOpen(true);
      }}>
        View Image
      </button>

      <AttachmentPreview
        attachment={selectedAttachment}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
```

### Multiple Images with Navigation

```tsx
import { AttachmentPreview, Attachment } from '@/components/feedback/AttachmentPreview';
import { useState } from 'react';

function ImageGallery() {
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const attachments: Attachment[] = [
    {
      id: 'att_01',
      url: 'https://example.com/image1.png',
      filename: 'first.png',
      size: 245678,
      mimeType: 'image/png',
      uploadedAt: '2025-01-15T10:30:00Z',
    },
    {
      id: 'att_02',
      url: 'https://example.com/image2.jpg',
      filename: 'second.jpg',
      size: 189234,
      mimeType: 'image/jpeg',
      uploadedAt: '2025-01-15T10:32:00Z',
    },
  ];

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!selectedAttachment) return;

    const currentIndex = attachments.findIndex(a => a.id === selectedAttachment.id);
    let newIndex: number;

    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
    } else {
      newIndex = currentIndex < attachments.length - 1 ? currentIndex + 1 : currentIndex;
    }

    setSelectedAttachment(attachments[newIndex]);
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        {attachments.map((attachment) => (
          <img
            key={attachment.id}
            src={attachment.url}
            alt={attachment.filename}
            className="cursor-pointer"
            onClick={() => {
              setSelectedAttachment(attachment);
              setIsOpen(true);
            }}
          />
        ))}
      </div>

      <AttachmentPreview
        attachment={selectedAttachment}
        allAttachments={attachments}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onNavigate={handleNavigate}
      />
    </>
  );
}
```

### Integration with Feedback Attachments

```tsx
import { AttachmentPreview, Attachment } from '@/components/feedback/AttachmentPreview';
import { Feedback } from '@/types/feedback';
import { useState } from 'react';

function FeedbackDetail({ feedback }: { feedback: Feedback }) {
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Parse JSON attachments from feedback
  const attachments: Attachment[] = JSON.parse(feedback.attachments || '[]');

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!selectedAttachment) return;
    const currentIndex = attachments.findIndex(a => a.id === selectedAttachment.id);
    const newIndex = direction === 'prev'
      ? Math.max(0, currentIndex - 1)
      : Math.min(attachments.length - 1, currentIndex + 1);
    setSelectedAttachment(attachments[newIndex]);
  };

  return (
    <>
      <div className="attachments">
        {attachments.map((attachment) => (
          <button
            key={attachment.id}
            onClick={() => {
              setSelectedAttachment(attachment);
              setIsOpen(true);
            }}
          >
            <img src={attachment.url} alt={attachment.filename} />
          </button>
        ))}
      </div>

      <AttachmentPreview
        attachment={selectedAttachment}
        allAttachments={attachments}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onNavigate={handleNavigate}
      />
    </>
  );
}
```

## API Reference

### AttachmentPreview Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `attachment` | `Attachment \| null` | Yes | The currently selected attachment to preview |
| `allAttachments` | `Attachment[]` | No | Array of all attachments for navigation (default: `[]`) |
| `isOpen` | `boolean` | Yes | Controls modal visibility |
| `onClose` | `() => void` | Yes | Callback when modal is closed |
| `onNavigate` | `(direction: 'prev' \| 'next') => void` | No | Callback for navigating between attachments |

### Attachment Type

```typescript
interface Attachment {
  id: string;           // Unique identifier (e.g., "att_01JDQK0E6PXWZYHVF6QNMR8QTZ")
  url: string;          // Full URL to the attachment
  filename: string;     // Original filename
  size: number;         // File size in bytes
  mimeType: string;     // MIME type (e.g., "image/png", "image/jpeg")
  uploadedAt: string;   // ISO 8601 timestamp
}
```

## Features

### Zoom Controls

- **Zoom In/Out**: Click the zoom buttons or use keyboard shortcuts
- **Zoom Range**: 0.5x (50%) to 3.0x (300%)
- **Zoom Increment**: 0.25 (25%) per step
- **Pan/Drag**: When zoomed in, click and drag to pan the image
- **Touch Support**: Pinch-to-zoom and drag on mobile devices

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `ESC` | Close the preview |
| `←` / `→` | Navigate to previous/next image |
| `+` / `=` | Zoom in |
| `-` / `_` | Zoom out |
| `0` | Reset zoom and position to default |

### Navigation

- **Arrow Buttons**: Visual navigation arrows appear when `allAttachments` has multiple items
- **Position Indicator**: Shows current position (e.g., "2 / 5") in the gallery
- **Disabled States**: Previous button disabled on first image, next button disabled on last image
- **Keyboard Navigation**: Arrow keys work when `onNavigate` callback is provided

### Download

- Click the download button to save the attachment to the user's device
- Uses the browser's native download mechanism
- Preserves original filename

### Accessibility

- **ARIA Labels**: All interactive elements have descriptive labels
- **Keyboard Navigation**: Full keyboard support for all interactions
- **Focus Management**: Focus is trapped within the modal when open
- **Screen Reader Announcements**: Live region announces current image and position
- **Semantic HTML**: Uses proper dialog role and structure

### Mobile Support

- **Touch Events**: Supports touch gestures for panning when zoomed
- **Responsive Design**: Adapts to mobile screen sizes
- **Backdrop Close**: Tap outside image to close (only on backdrop, not image)

### Non-Image Files

For attachments with non-image MIME types:

- Shows a fallback message: "Preview not available for this file type."
- Displays the MIME type
- Download button still available
- Zoom controls are hidden

## Implementation Details

### Body Scroll Prevention

When the modal is open, body scrolling is prevented:

```typescript
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
  return () => {
    document.body.style.overflow = '';
  };
}, [isOpen]);
```

### Zoom State Reset

Zoom and pan position are reset when the attachment changes:

```typescript
useEffect(() => {
  setZoom(1);
  setPosition({ x: 0, y: 0 });
}, [attachment?.id]);
```

### File Size Formatting

File sizes are formatted to human-readable units:

- `formatFileSize(1024)` → `"1 KB"`
- `formatFileSize(1048576)` → `"1 MB"`
- `formatFileSize(245678)` → `"239.92 KB"`

### Date Formatting

Upload dates are formatted for readability:

- `formatDate("2025-01-15T10:30:00Z")` → `"Jan 15, 2025, 10:30 AM"`

## Styling

The component uses Tailwind CSS utility classes and integrates with the application theme:

- **Dark Overlay**: `bg-black/95 backdrop-blur-sm`
- **Gradients**: Top and bottom bars use gradient overlays
- **Transitions**: Smooth fade and zoom animations
- **Responsive**: Mobile-first responsive design
- **Theme Integration**: Uses `shadcn/ui` button variants and colors

### Custom Styling

You can customize the appearance by modifying the Tailwind classes or wrapping the component:

```tsx
<div className="custom-lightbox-wrapper">
  <AttachmentPreview {...props} />
</div>
```

## Testing

The component includes comprehensive tests in `AttachmentPreview.test.tsx`:

- Rendering and visibility tests
- Keyboard navigation tests
- Zoom control tests
- Download functionality tests
- Accessibility tests
- Multi-image navigation tests

Run tests:

```bash
npm run test src/components/feedback/AttachmentPreview.test.tsx
```

## Example Integration

See `AttachmentPreview.example.tsx` for a complete working example that demonstrates:

1. Image grid gallery
2. List view with preview buttons
3. Featured image preview
4. Keyboard shortcuts reference

## Browser Support

The component works in all modern browsers:

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

## Performance Considerations

- **Lazy Loading**: Images are loaded only when the modal opens
- **Event Cleanup**: All event listeners are properly cleaned up on unmount
- **Optimized Re-renders**: Uses React hooks to minimize unnecessary re-renders
- **Memory Management**: URL objects are revoked after download completes

## Future Enhancements

Potential improvements for future versions:

- [ ] Video file preview support
- [ ] PDF preview with page navigation
- [ ] Image rotation controls
- [ ] Slideshow mode with auto-advance
- [ ] Image comparison (side-by-side)
- [ ] Annotation/markup tools
- [ ] Share functionality
- [ ] Print option

## Related Components

- `FeedbackCard` - Displays feedback items with attachment thumbnails
- `FeedbackDetail` - Shows full feedback with attachment gallery
- `AttachmentUpload` - Handles attachment upload functionality (to be implemented)

## Support

For issues or questions:

1. Check this README
2. Review the example file: `AttachmentPreview.example.tsx`
3. Check the test file for usage patterns: `AttachmentPreview.test.tsx`
4. Consult the main documentation: `/docs/USER_GUIDE.md`

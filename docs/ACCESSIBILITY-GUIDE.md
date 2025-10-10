# Accessibility Guide - Gentil Feedback

## Overview

This guide provides accessibility standards and best practices for the Gentil Feedback application. All components should meet WCAG 2.1 Level AA standards.

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Keyboard Navigation](#keyboard-navigation)
3. [ARIA Attributes](#aria-attributes)
4. [Focus Management](#focus-management)
5. [Screen Reader Support](#screen-reader-support)
6. [Color & Contrast](#color--contrast)
7. [Testing](#testing)
8. [Component Examples](#component-examples)

---

## Quick Reference

### WCAG 2.1 Level AA Requirements

| Category | Requirement | Standard |
|----------|-------------|----------|
| **Keyboard** | All functionality via keyboard | Required |
| **Focus** | Visible focus indicator (2px minimum) | Required |
| **Text Contrast** | 4.5:1 for normal text | Required |
| **UI Contrast** | 3:1 for components/borders | Required |
| **ARIA** | Proper labels on all interactive elements | Required |
| **Errors** | Announced to screen readers | Required |
| **Status** | Dynamic updates announced | Required |

---

## Keyboard Navigation

### Essential Keyboard Shortcuts

```typescript
// Global shortcuts
Tab           // Navigate forward
Shift+Tab     // Navigate backward
Enter         // Activate buttons, submit forms
Space         // Toggle checkboxes, activate buttons
Escape        // Close dialogs, cancel operations
Arrow Keys    // Navigate within components

// Application-specific
Ctrl/Cmd+Enter  // Quick save (where applicable)
```

### Implementation Pattern

```typescript
const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
  // Quick save
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isSubmitting) {
    e.preventDefault();
    handleSubmit('draft');
  }

  // Cancel
  if (e.key === 'Escape' && !isSubmitting && !isModalOpen) {
    e.preventDefault();
    router.back();
  }
};

<form onKeyDown={handleKeyDown}>
  {/* form content */}
</form>
```

### Tab Order

Ensure logical tab order that follows visual layout:

```tsx
// Good: Natural DOM order
<form>
  <input id="title" />        {/* Tab 1 */}
  <textarea id="description" /> {/* Tab 2 */}
  <button type="submit">Save</button> {/* Tab 3 */}
</form>

// Bad: Don't use tabIndex for reordering
<form>
  <input tabIndex={3} />  // Avoid
  <textarea tabIndex={1} /> // Avoid
</form>
```

---

## ARIA Attributes

### Required ARIA Labels

#### Forms
```tsx
<form aria-label="Create questionnaire form">
  <input
    id="title"
    aria-label="Title"
    aria-required="true"
    aria-invalid={hasError ? 'true' : 'false'}
    aria-describedby="title-help title-error"
  />
  <span id="title-help">Enter a descriptive title</span>
  {hasError && (
    <span id="title-error" role="alert">Title is required</span>
  )}
</form>
```

#### Buttons (Icon-only)
```tsx
// Bad: No accessible name
<button>
  <TrashIcon />
</button>

// Good: Aria label
<button aria-label="Delete question">
  <TrashIcon aria-hidden="true" />
</button>

// Good: Visible text
<button>
  <TrashIcon aria-hidden="true" />
  Delete
</button>
```

#### Dynamic Content
```tsx
// Status updates (non-critical)
<div role="status" aria-live="polite" aria-atomic="true">
  {isLoading && 'Saving...'}
</div>

// Errors (critical)
<div role="alert" aria-live="assertive">
  {error && error.message}
</div>

// Hidden from screen readers
<span aria-hidden="true">🎉</span>
```

### ARIA Attribute Reference

| Attribute | Usage | Example |
|-----------|-------|---------|
| `aria-label` | Labels element when no visible label | `<button aria-label="Close">×</button>` |
| `aria-labelledby` | References visible label by ID | `<input aria-labelledby="label-id">` |
| `aria-describedby` | Additional description | `<input aria-describedby="help-text">` |
| `aria-required` | Marks required fields | `<input aria-required="true">` |
| `aria-invalid` | Marks invalid inputs | `<input aria-invalid="true">` |
| `aria-live` | Live region politeness | `<div aria-live="polite">` |
| `aria-atomic` | Announce entire region | `<div aria-atomic="true">` |
| `aria-hidden` | Hides decorative elements | `<span aria-hidden="true">` |

---

## Focus Management

### Visible Focus Indicators

All interactive elements must have visible focus indicators:

```css
/* Default focus (via Tailwind/Shadcn) */
.element:focus {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

/* Custom focus ring */
.element:focus-visible {
  ring-2 ring-offset-2 ring-primary
}
```

### Focus on Error

```typescript
const errorRef = useRef<HTMLDivElement>(null);

const handleSubmit = () => {
  const error = validateForm();
  if (error) {
    setError(error);
    // Focus error message for screen readers
    setTimeout(() => {
      errorRef.current?.focus();
    }, 100);
    return;
  }
  // ... continue
};

return (
  <Alert
    ref={errorRef}
    role="alert"
    aria-live="assertive"
    tabIndex={-1}
  >
    {error}
  </Alert>
);
```

### Focus Trap in Modals

Modals should trap focus (handled automatically by Dialog/Sheet components):

```tsx
// Dialog component handles focus trapping
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    {/* Focus stays within dialog */}
  </DialogContent>
</Dialog>
```

---

## Screen Reader Support

### Semantic HTML

Use semantic HTML elements:

```tsx
// Good: Semantic elements
<form>
  <fieldset>
    <legend>User Information</legend>
    <label htmlFor="name">Name</label>
    <input id="name" />
  </fieldset>
</form>

// Bad: Divs for everything
<div>
  <div>User Information</div>
  <div>Name</div>
  <div contentEditable />
</div>
```

### Live Regions

```tsx
// Loading state
<div className="sr-only" role="status" aria-live="polite">
  {isLoading && 'Loading data...'}
</div>

// Error messages
<div role="alert" aria-live="assertive">
  {error && `Error: ${error.message}`}
</div>

// Success messages
<div role="status" aria-live="polite">
  {success && 'Changes saved successfully'}
</div>
```

### Screen Reader Only Text

```tsx
// CSS class (via Tailwind)
<span className="sr-only">
  This text is only visible to screen readers
</span>

/* CSS implementation */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

## Color & Contrast

### Contrast Ratios

**Text**:
- Normal text (< 18px or < 14px bold): 4.5:1
- Large text (≥ 18px or ≥ 14px bold): 3:1

**UI Components**:
- Interactive elements: 3:1
- Focus indicators: 3:1

### Testing Contrast

Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/):

```tsx
// Good: Sufficient contrast
<button className="bg-blue-600 text-white">
  {/* Blue #2563eb on White #ffffff = 8.59:1 ✓ */}
  Submit
</button>

// Bad: Insufficient contrast
<button className="bg-gray-300 text-white">
  {/* Gray #d1d5db on White #ffffff = 1.84:1 ✗ */}
  Submit
</button>
```

### Don't Rely on Color Alone

```tsx
// Bad: Color only
<span className="text-red-500">Error</span>

// Good: Color + icon/text
<span className="text-red-500">
  <AlertCircle aria-hidden="true" />
  Error: Please check your input
</span>
```

---

## Testing

### Manual Testing Checklist

#### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Shift+Tab navigates backwards
- [ ] Enter activates buttons
- [ ] Space toggles checkboxes
- [ ] Escape closes dialogs
- [ ] Arrow keys work in radio groups
- [ ] No keyboard traps

#### Visual Inspection
- [ ] Focus indicators visible on all elements
- [ ] Text contrast meets 4.5:1
- [ ] UI component contrast meets 3:1
- [ ] Focus indicator has 2px outline
- [ ] Layout works at 200% zoom

#### Screen Reader Testing (VoiceOver)
```bash
# Enable VoiceOver on macOS
Cmd + F5

# Basic commands
VO = Ctrl + Option
VO + Right Arrow  # Next element
VO + Left Arrow   # Previous element
VO + Space        # Activate element
VO + A            # Start reading
VO + H            # Next heading
VO + L            # Next link
```

Test checklist:
- [ ] All form fields announced with labels
- [ ] Required fields announced
- [ ] Error messages announced
- [ ] Button actions clear
- [ ] Loading states announced
- [ ] Status updates announced

### Automated Testing

#### axe DevTools

1. Install [axe DevTools](https://www.deque.com/axe/devtools/) browser extension
2. Open DevTools
3. Navigate to "axe DevTools" tab
4. Click "Scan ALL of my page"
5. Review and fix issues

#### Lighthouse

```bash
# Run Lighthouse audit
npm run lighthouse
```

Focus on:
- Accessibility score (aim for 100)
- Best Practices
- SEO

---

## Component Examples

### Accessible Form Component

```tsx
'use client';

import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function AccessibleForm() {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Name is required');
      setTimeout(() => errorRef.current?.focus(), 100);
      return;
    }

    // Submit logic
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="User registration form"
    >
      {error && (
        <Alert
          variant="destructive"
          role="alert"
          aria-live="assertive"
          ref={errorRef}
          tabIndex={-1}
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="name">
          Name <span className="text-red-500" aria-label="required">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-required="true"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby="name-help"
        />
        <span id="name-help" className="text-sm text-muted-foreground">
          Enter your full name
        </span>
      </div>

      <Button type="submit">
        Submit
      </Button>
    </form>
  );
}
```

### Accessible Modal

```tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function AccessibleModal({ open, onClose }: Props) {
  // Focus management handled by Dialog component

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmation</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this item?
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Accessible Icon Button

```tsx
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AccessibleIconButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      aria-label="Delete item"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}
```

---

## Resources

### Official Guidelines
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Screen Readers
- **macOS**: VoiceOver (Cmd+F5)
- **Windows**: NVDA (free), JAWS (paid)
- **Mobile**: VoiceOver (iOS), TalkBack (Android)

---

## Getting Help

If you have accessibility questions:
1. Check this guide first
2. Review [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
3. Test with axe DevTools
4. Test with a screen reader

**Remember**: Accessibility is not optional—it's a fundamental requirement for all features.

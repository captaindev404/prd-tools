# Accessibility Quick Reference Card

**Quick guide for developers** - Keep this handy when building components!

---

## Essential Keyboard Shortcuts

```
Tab             → Navigate forward
Shift+Tab       → Navigate backward
Enter           → Activate button / Submit form
Space           → Toggle checkbox / Activate button
Escape          → Close dialog / Cancel
Arrow Keys      → Navigate within component
Ctrl/Cmd+Enter  → Quick save (custom)
```

---

## ARIA Cheat Sheet

### Common Patterns

```tsx
// ✅ Form Input
<Input
  id="name"
  aria-label="Name"
  aria-required="true"
  aria-invalid="false"
  aria-describedby="name-help"
/>

// ✅ Icon Button
<Button aria-label="Delete">
  <Trash2 aria-hidden="true" />
</Button>

// ✅ Required Field
<Label>
  Name <span aria-label="required">*</span>
</Label>

// ✅ Error Message
<div role="alert" aria-live="assertive">
  {error}
</div>

// ✅ Loading State
<div role="status" aria-live="polite">
  {isLoading && 'Loading...'}
</div>

// ✅ Decorative Icon
<Icon aria-hidden="true" />
```

---

## Focus Management

```tsx
// Focus on error
const errorRef = useRef<HTMLDivElement>(null);

if (error) {
  setTimeout(() => errorRef.current?.focus(), 100);
}

<Alert ref={errorRef} tabIndex={-1} role="alert">
  {error}
</Alert>
```

---

## Screen Reader Only Text

```tsx
<span className="sr-only">
  This text is only for screen readers
</span>
```

---

## Contrast Requirements

| Type | Ratio | Example |
|------|-------|---------|
| Normal text | 4.5:1 | Body text |
| Large text | 3:1 | Headings |
| UI components | 3:1 | Buttons, borders |
| Focus indicator | 3:1 | Outline |

---

## Common Mistakes to Avoid

### ❌ DON'T
```tsx
// No label
<button><TrashIcon /></button>

// Color only
<span className="text-red-500">Error</span>

// Missing alt text
<img src="avatar.jpg" />

// Div as button
<div onClick={handleClick}>Click me</div>
```

### ✅ DO
```tsx
// With label
<button aria-label="Delete">
  <TrashIcon aria-hidden="true" />
</button>

// Color + icon + text
<span className="text-red-500">
  <AlertIcon aria-hidden="true" />
  Error: Invalid input
</span>

// With alt text
<img src="avatar.jpg" alt="User avatar" />

// Proper button
<button onClick={handleClick}>Click me</button>
```

---

## Testing Checklist

### Quick Tests (2 minutes)
- [ ] Tab through entire page
- [ ] Shift+Tab backward
- [ ] All buttons activate with Enter/Space
- [ ] Escape closes dialogs
- [ ] Focus indicators visible

### Screen Reader (5 minutes)
- [ ] Open VoiceOver (Cmd+F5 on Mac)
- [ ] Navigate with VO+Right Arrow
- [ ] Check all labels announced
- [ ] Check required fields announced
- [ ] Check errors announced

### Tools (1 minute)
- [ ] Run axe DevTools scan
- [ ] Check contrast with WebAIM

---

## Quick Fixes

### "Button has no accessible name"
```tsx
// Add aria-label
<button aria-label="Close">×</button>
```

### "Form field has no label"
```tsx
// Add Label with htmlFor
<Label htmlFor="name">Name</Label>
<Input id="name" />
```

### "Element not keyboard accessible"
```tsx
// Use proper HTML element
<button onClick={...}>     // ✅
<div onClick={...}>        // ❌
```

### "Insufficient contrast"
```tsx
// Use darker colors
className="text-gray-400"  // ❌ May fail
className="text-gray-700"  // ✅ Better
```

---

## Resources

- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Practices**: https://www.w3.org/WAI/ARIA/apg/
- **axe DevTools**: https://www.deque.com/axe/devtools/
- **Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Full Guide**: [/docs/ACCESSIBILITY-GUIDE.md](/docs/ACCESSIBILITY-GUIDE.md)

---

**Remember**: Accessibility is not optional!

If you're unsure, check the [full accessibility guide](/docs/ACCESSIBILITY-GUIDE.md) or test with a screen reader.

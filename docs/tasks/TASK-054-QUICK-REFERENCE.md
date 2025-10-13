# Autosave Quick Reference Card

## TL;DR

Autosave automatically saves form drafts every 30 seconds with visual feedback and network resilience.

## Installation (Already Done)

```bash
# No additional dependencies needed
# All code is in /src/hooks and /src/components
```

## Basic Usage

```tsx
import { QuestionnaireAutosaveWrapper } from '@/components/questionnaires/questionnaire-autosave-wrapper';

function MyForm() {
  const [draftId, setDraftId] = useState<string | null>(null);

  return (
    <QuestionnaireAutosaveWrapper
      draftId={draftId}
      onDraftIdChange={setDraftId}
      formData={{ title, questions, ... }}
    >
      <YourFormContent />
    </QuestionnaireAutosaveWrapper>
  );
}
```

## Advanced Usage (Direct Hook)

```tsx
import { useAutosave } from '@/hooks/use-autosave';
import { AutosaveIndicator } from '@/components/questionnaires/AutosaveIndicator';

function MyForm() {
  const autosave = useAutosave({
    data: formData,
    onSave: async (data) => {
      await fetch('/api/save', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    debounceDelay: 30000
  });

  return (
    <div>
      <AutosaveIndicator state={autosave.state} />
      <form>{/* ... */}</form>
    </div>
  );
}
```

## Props

### QuestionnaireAutosaveWrapper

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `draftId` | `string \| null` | Yes | Current draft ID (null for new) |
| `onDraftIdChange` | `(id: string) => void` | Yes | Called after first save |
| `formData` | `Object` | Yes | Form data to save |
| `enabled` | `boolean` | No | Enable/disable autosave (default: true) |

### useAutosave

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `data` | `T` | - | Data to save |
| `onSave` | `(data: T) => Promise<void>` | - | Save function |
| `debounceDelay` | `number` | 30000 | Delay in ms |
| `enabled` | `boolean` | true | Enable/disable |
| `retryConfig.maxRetries` | `number` | 3 | Max retry attempts |
| `retryConfig.initialDelay` | `number` | 1000 | First retry delay (ms) |
| `retryConfig.maxDelay` | `number` | 10000 | Max retry delay (ms) |

## Return Value (useAutosave)

```typescript
{
  state: {
    isSaving: boolean;
    hasUnsavedChanges: boolean;
    lastSaved: Date | null;
    error: Error | null;
    retryCount: number;
  },
  actions: {
    saveNow: () => Promise<void>;
    markAsChanged: () => void;
    clearUnsavedChanges: () => void;
    clearError: () => void;
  }
}
```

## Visual States

| State | Icon | Color | Message |
|-------|------|-------|---------|
| Saving | Spinner | Blue | "Saving..." |
| Saved | Checkmark | Green | "Last saved X ago" |
| Unsaved | Clock | Amber | "Unsaved changes" |
| Error | Alert | Red | Error message |
| Offline | Cloud-off | Red | "No network connection" |

## Common Patterns

### Manual Save Button

```tsx
<Button
  onClick={() => autosave.actions.saveNow()}
  disabled={autosave.state.isSaving}
>
  Save Now
</Button>
```

### Conditional Autosave

```tsx
const autosave = useAutosave({
  data: formData,
  onSave: saveFunction,
  enabled: isDirty && isValid // Only save if dirty and valid
});
```

### Custom Retry Logic

```tsx
const autosave = useAutosave({
  data: formData,
  onSave: saveFunction,
  retryConfig: {
    maxRetries: 5,
    initialDelay: 2000,
    maxDelay: 30000
  }
});
```

## Debugging

### Enable Logging

```javascript
// Already built-in, check console:
// - "Skipping autosave: title too short"
// - "Autosave failed, retrying..."
// - "Connection restored, attempting to save..."
```

### Network Simulation

```javascript
// In Chrome DevTools:
// 1. Open Network tab
// 2. Select "Offline" or "Slow 3G"
// 3. Watch autosave retry behavior
```

### Force Save

```javascript
// In browser console:
document.querySelector('button').click(); // Click Save button
// OR
autosave.actions.saveNow(); // If you have ref to autosave
```

## Troubleshooting

### Autosave Not Firing

1. Check form data is changing: `console.log(formData)`
2. Check enabled prop: `enabled={true}`
3. Check validation: Form must pass minimum requirements
4. Wait 30 seconds after last change

### Network Errors

1. Check network tab in DevTools
2. Verify API endpoint exists: `/api/questionnaires`
3. Check authentication: Must be logged in
4. Check CORS if applicable

### State Not Updating

1. Check if data is memoized correctly
2. Verify onSave function doesn't throw unhandled errors
3. Check React DevTools for state updates

## Testing

### Unit Tests (Future)

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAutosave } from '@/hooks/use-autosave';

test('saves after debounce delay', async () => {
  const onSave = jest.fn();
  const { result } = renderHook(() =>
    useAutosave({ data: { title: 'Test' }, onSave })
  );

  await act(async () => {
    jest.advanceTimersByTime(30000);
  });

  expect(onSave).toHaveBeenCalledTimes(1);
});
```

### Manual Test Checklist

- [ ] Autosave fires after 30s
- [ ] Indicator shows "Saving..."
- [ ] Indicator shows "Last saved X ago"
- [ ] Network error handling works
- [ ] Offline detection works
- [ ] Cursor position preserved
- [ ] Focus not lost
- [ ] Keyboard shortcuts still work

## Performance Tips

1. **Memoize form data** to prevent unnecessary re-renders
2. **Use refs** for non-render state
3. **Cleanup timers** on unmount
4. **Batch changes** before save (automatic with debounce)

## Security Notes

- Autosave uses existing auth (no additional auth needed)
- Validates input before sending to server
- No sensitive data in console logs (in production)
- Uses HTTPS for API requests

## Browser Support

- ✅ Chrome 120+
- ✅ Firefox 121+
- ✅ Safari 17+
- ✅ Edge 120+

Requires: `window.fetch`, `window.addEventListener`, `Promise`, `async/await`

## Related Files

- Hook: `/src/hooks/use-autosave.ts`
- Component: `/src/components/questionnaires/AutosaveIndicator.tsx`
- Wrapper: `/src/components/questionnaires/questionnaire-autosave-wrapper.tsx`
- Docs: `/docs/tasks/TASK-054-*.md`

## Support

For questions or issues:
1. Check `/docs/tasks/TASK-054-AUTOSAVE-IMPLEMENTATION.md`
2. Review `/docs/tasks/TASK-054-USAGE-EXAMPLE.tsx`
3. Check browser console for errors
4. Contact team lead

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-10-13 | Initial implementation |

---

**Quick Links**:
- [Full Implementation Guide](./TASK-054-AUTOSAVE-IMPLEMENTATION.md)
- [Usage Examples](./TASK-054-USAGE-EXAMPLE.tsx)
- [Completion Summary](./TASK-054-COMPLETION-SUMMARY.md)

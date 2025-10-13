# ResponseSettingsTab Component

## Overview

The `ResponseSettingsTab` component provides a comprehensive interface for configuring questionnaire response settings, including anonymity, response limits, scheduling, and maximum response caps.

## Features

- **Anonymous Responses**: Checkbox to enable/disable anonymous response collection
- **Response Limits**: Dropdown with options for response frequency (once, daily, weekly, unlimited)
- **Schedule Settings**: Date pickers for start and end dates with validation
- **Maximum Total Responses**: Optional number input for capping total responses
- **Settings Summary**: Visual summary of configured settings
- **Validation**: Built-in date validation and error display
- **Accessibility**: Full ARIA support, keyboard navigation, and screen reader compatibility

## API

### Props

```typescript
interface ResponseSettings {
  anonymous: boolean;
  responseLimit: 'once' | 'daily' | 'weekly' | 'unlimited';
  startAt: Date | null;
  endAt: Date | null;
  maxTotalResponses: number | null;
}

interface ResponseSettingsTabProps {
  settings: ResponseSettings;
  onChange: (settings: ResponseSettings) => void;
  errors?: {
    startAt?: string;
    endAt?: string;
    maxTotalResponses?: string;
  };
}
```

### Default Values

```typescript
{
  anonymous: false,
  responseLimit: 'once',
  startAt: null,  // Defaults to now when published
  endAt: null,    // No end date
  maxTotalResponses: null  // Unlimited
}
```

## Usage

### Basic Example

```tsx
import { useState } from 'react';
import { ResponseSettingsTab, ResponseSettings } from './ResponseSettingsTab';

function MyForm() {
  const [settings, setSettings] = useState<ResponseSettings>({
    anonymous: false,
    responseLimit: 'once',
    startAt: null,
    endAt: null,
    maxTotalResponses: null,
  });

  return (
    <ResponseSettingsTab
      settings={settings}
      onChange={setSettings}
    />
  );
}
```

### With Error Handling

```tsx
const [errors, setErrors] = useState({});

<ResponseSettingsTab
  settings={settings}
  onChange={setSettings}
  errors={errors}
/>
```

### Integration with Form Submission

```tsx
const handleSubmit = async () => {
  // Transform settings for API
  const apiData = {
    anonymous: settings.anonymous,
    responseLimit: settings.responseLimit === 'unlimited' ? 0 :
                   settings.responseLimit === 'once' ? 1 :
                   settings.responseLimit === 'daily' ? 1 :
                   settings.responseLimit === 'weekly' ? 7 : 0,
    startAt: settings.startAt?.toISOString() || null,
    endAt: settings.endAt?.toISOString() || null,
    maxResponses: settings.maxTotalResponses,
  };

  await fetch('/api/questionnaires', {
    method: 'POST',
    body: JSON.stringify(apiData),
  });
};
```

## Validation

The component includes built-in validation for:

1. **Date Order**: End date must be after start date
2. **Date Range**: Start date cannot be in the past
3. **Max Responses**: Must be a positive integer if provided

Validation errors are displayed inline with appropriate ARIA attributes.

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Screen Readers**: Proper ARIA labels and descriptions
- **Focus Management**: Logical tab order and focus indicators
- **Error Announcements**: Validation errors announced to screen readers
- **Help Text**: Contextual help for each setting

## Response Limit Options

| Value | Description | Use Case |
|-------|-------------|----------|
| `once` | One response per user | One-time surveys, feedback forms |
| `daily` | One response per day | Daily check-ins, mood tracking |
| `weekly` | One response per week | Weekly feedback, recurring surveys |
| `unlimited` | No limit | Continuous feedback, open discussions |

## Settings Summary

The component displays a visual summary of all configured settings at the bottom:

- Anonymity status
- Response limit policy
- Active period (start → end)
- Total response cap (if set)

## Design Decisions

### Date Picker vs DateTime Input

The component uses a visual date picker (Calendar + Popover) instead of native `<input type="datetime-local">` for several reasons:

1. **Better UX**: Visual calendar is more intuitive
2. **Consistent Cross-Browser**: Native datetime inputs have inconsistent support
3. **Accessibility**: Better screen reader support with custom implementation
4. **Validation**: Built-in date range validation
5. **Mobile-Friendly**: Touch-optimized calendar interface

### Response Limit Mapping

The task spec mentions `once | daily | weekly | unlimited`, but the database schema uses a numeric `responseLimit` field. The component uses string enums for clarity and maps to numbers during submission:

- `once` → `1`
- `daily` → `1` (with implied daily reset logic)
- `weekly` → `7` (interpreted as once per 7 days)
- `unlimited` → `0`

### Start Date Default

When `startAt` is `null`, the questionnaire starts immediately upon publishing. This provides flexibility for:
- Drafts that will be published later
- Scheduled questionnaires
- Immediate activation scenarios

## Example Screenshots

### Anonymous Responses
```
☐ Allow anonymous responses
  When enabled, respondent names will not be recorded.
  Only aggregated data will be available.
```

### Response Limit
```
Response Limit per User
┌─────────────────────────┐
│ Once only          ▼    │
└─────────────────────────┘
Users can respond only once to this questionnaire
```

### Schedule Settings
```
Schedule
Set when the questionnaire becomes available and when it closes

Start Date
┌──────────────────────────┐
│ 📅 January 15, 2025  ▼  │
└──────────────────────────┘
When the questionnaire becomes available...

End Date (Optional)
┌──────────────────────────┐
│ 📅 No end date       ▼  │
└──────────────────────────┘
When the questionnaire closes...
```

### Settings Summary
```
╔══════════════════════════════════════╗
║ Settings Summary                      ║
║                                       ║
║ • Anonymity: Responses will include   ║
║   user names                          ║
║ • Response limit: Once per user       ║
║ • Active period: January 15, 2025 →   ║
║   No end date                         ║
╚══════════════════════════════════════╝
```

## Related Components

- `QuestionnaireCreateForm` - Parent form component
- `QuestionnaireEditForm` - Edit form using same settings
- `QuestionnairePublishDialog` - Uses settings for confirmation
- `Calendar` - Date picker component
- `Popover` - Calendar dropdown

## Files

- `ResponseSettingsTab.tsx` - Main component
- `ResponseSettingsTab.example.tsx` - Integration example
- `ResponseSettingsTab.md` - This documentation

## Testing

### Test Scenarios

1. **Anonymous Toggle**
   - Check/uncheck anonymous checkbox
   - Verify state updates correctly
   - Verify help text displays

2. **Response Limit Selection**
   - Select each option
   - Verify correct help text displays
   - Verify state updates

3. **Date Validation**
   - Select end date before start date
   - Verify error message displays
   - Verify error clears when fixed

4. **Past Date Prevention**
   - Try to select past date for start
   - Verify date is disabled
   - Verify end date must be after start

5. **Max Responses Validation**
   - Enter negative number
   - Enter zero
   - Enter positive number
   - Verify validation

6. **Settings Summary**
   - Configure various settings
   - Verify summary updates correctly
   - Verify formatting

## Future Enhancements

- [ ] Time of day selection (not just date)
- [ ] Timezone selection for multi-region deployments
- [ ] Response limit by role (e.g., managers can respond unlimited)
- [ ] Recurring schedule patterns (e.g., every Monday)
- [ ] Response quota by panel (different limits per panel)
- [ ] Auto-close when reaching response limit
- [ ] Email notifications when questionnaire opens/closes

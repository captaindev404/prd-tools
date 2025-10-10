# BilingualTextField Component

## Overview

The `BilingualTextField` component provides a user-friendly interface for entering text in both English and French, with clear visual indicators for language completeness.

## Features

- **Tab Switcher**: Toggle between English and French input
- **Completeness Badges**: Visual indicators showing which languages have content
- **Active Tab Indicator**: Green dot on tabs that have content
- **Validation**: Error message when both languages are empty
- **Consistent UX**: Same interface across all question types

## Usage

```tsx
import { BilingualTextField } from './question-builder';

function MyComponent() {
  const [text, setText] = useState({ en: '', fr: '' });

  return (
    <BilingualTextField
      label="Question Text"
      value={text}
      onChange={setText}
      placeholder={{
        en: 'Enter your question in English...',
        fr: 'Entrez votre question en français...'
      }}
    />
  );
}
```

## Visual Structure

```
┌──────────────────────────────────────────────────────┐
│ Question Text                    [EN ✓]  [FR ○]      │
├──────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐    │
│  │  [English ●]  │  [Français]                  │    │
│  └──────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────┐    │
│  │                                               │    │
│  │  Enter your question in English...            │    │
│  │                                               │    │
│  │                                               │    │
│  └──────────────────────────────────────────────┘    │
│  ⚠ At least one language is required                 │
└──────────────────────────────────────────────────────┘
```

## Component States

### 1. Empty State
- Both EN and FR badges are outlined (not filled)
- No green dots on tabs
- Error message displayed: "At least one language is required"

```tsx
{ en: '', fr: '' }
```

### 2. English Only
- EN badge is filled with checkmark (✓)
- FR badge is outlined
- Green dot on English tab
- No error message

```tsx
{ en: 'What is your rating?', fr: '' }
```

### 3. French Only
- FR badge is filled with checkmark (✓)
- EN badge is outlined
- Green dot on Français tab
- No error message

```tsx
{ en: '', fr: 'Quelle est votre évaluation?' }
```

### 4. Both Languages Complete
- Both EN and FR badges are filled with checkmarks (✓)
- Green dots on both tabs
- No error message

```tsx
{
  en: 'What is your rating?',
  fr: 'Quelle est votre évaluation?'
}
```

## Props

```typescript
interface BilingualTextFieldProps {
  label: string;              // Field label displayed at top
  value: {                    // Current text values
    en: string;
    fr: string;
  };
  onChange: (value: {         // Callback when text changes
    en: string;
    fr: string;
  }) => void;
  placeholder?: {             // Optional placeholder text
    en: string;
    fr: string;
  };
}
```

## Visual Indicators

### Badge States

**Filled Badge (has content)**
```
┌─────────┐
│ EN ✓    │  ← Dark background, white text, checkmark
└─────────┘
```

**Outlined Badge (empty)**
```
┌─────────┐
│ FR      │  ← Border only, transparent background
└─────────┘
```

### Tab Indicators

**Active Tab with Content**
```
┌───────────────┐
│ English    ●  │  ← Selected, green dot at top-right
└───────────────┘
```

**Inactive Tab**
```
┌───────────────┐
│ Français      │  ← Not selected, no dot
└───────────────┘
```

## Accessibility

- **Keyboard Navigation**: Tab key moves between tabs and textarea
- **Screen Reader**: Proper labels and ARIA attributes
- **Focus Management**: Clear focus indicators
- **Error Announcements**: Validation errors are announced

## Integration

This component is used in the QuestionBuilder for all 7 question types:

1. Likert Scale (5/7 point)
2. NPS (0-10 scale)
3. Multiple Choice - Single
4. Multiple Choice - Multiple
5. Text Response
6. Number Input
7. Rating (Stars)

## Validation

The form validation in `questionnaire-create-form.tsx` ensures:

```typescript
// At least one language must have text
if (!q.text.en.trim() && !q.text.fr.trim()) {
  return `Question ${i + 1} must have text in at least one language (English or French)`;
}
```

## Benefits

### For Users
- **Clear Feedback**: Immediately see which languages are complete
- **Less Clutter**: Tabs reduce vertical space
- **Better Workflow**: Easy to see what needs translation
- **Consistent**: Same pattern everywhere

### For Developers
- **Reusable**: Can be used anywhere bilingual input is needed
- **Type-Safe**: Proper TypeScript interfaces
- **Maintainable**: Single source of truth
- **Extensible**: Easy to add more languages

## Future Enhancements

Potential improvements:
1. Character count per language
2. Translation helper/suggestions
3. Language preference memory
4. Copy from one language to another
5. Auto-translate option (with review)
6. Bilingual preview side-by-side

## Related Components

- `QuestionBuilder`: Uses BilingualTextField for all questions
- `QuestionnaireCreateForm`: Validates bilingual content
- `QuestionnairePreviewModal`: Shows how questions appear in each language

## Code Location

**File**: `/src/components/questionnaires/question-builder.tsx`
**Lines**: 38-99 (BilingualTextField component)
**Export**: Used internally in QuestionBuilder

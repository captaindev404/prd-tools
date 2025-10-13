# Questionnaire Validation System

This directory contains comprehensive Zod-based validation schemas for the questionnaire creation and management system.

## Overview

The validation system provides:

- **Type-safe validation** using Zod schemas
- **React Hook Form integration** via `@hookform/resolvers/zod`
- **Field-level and form-level validation**
- **Helpful error messages** for users
- **Runtime type checking** and compile-time type inference

## Files

### `questionnaire-validation.ts`

Main validation module containing:

- **Zod Schemas**: All validation rules defined as Zod schemas
- **Type Exports**: TypeScript types inferred from Zod schemas
- **Helper Functions**: Validation utilities and data transformers
- **Type Guards**: Runtime type checking functions

### `__tests__/questionnaire-validation.test.ts`

Comprehensive test suite with 49 tests covering:

- Question validation (all types: text, MCQ, Likert, NPS, rating)
- Targeting validation (all types: all_users, specific_panels, by_role)
- Date range validation
- MCQ option uniqueness and count validation
- Helper function behavior

## Validation Rules

### 1. Title Validation

```typescript
- Required
- Min length: 3 characters
- Max length: 200 characters
- Whitespace trimmed automatically
```

### 2. Questions Validation

```typescript
- At least 1 question required
- Each question must have:
  - Unique ID
  - Valid type (text, mcq_single, mcq_multiple, likert, nps, rating, number)
  - Text: 5-500 characters
  - Required flag (boolean)
```

### 3. MCQ-Specific Validation

```typescript
- Minimum 2 options required
- Options must be unique (case-insensitive)
- Each option: 1-200 characters
- Options cannot be empty strings
```

### 4. Targeting Validation

```typescript
- Type must be one of: all_users, specific_panels, specific_villages, by_role
- If specific_panels: at least 1 panel ID required
- If specific_villages: at least 1 village ID required
- If by_role: at least 1 role required
```

### 5. Date Range Validation

```typescript
- Both optional
- If both provided: endAt must be after startAt
- Must be valid ISO datetime strings
```

### 6. Max Responses Validation

```typescript
- Optional
- Must be positive integer if provided
- Cannot be zero or negative
```

## Usage

### Basic Validation

```typescript
import { validateQuestionnaire } from '@/lib/validations/questionnaire-validation';

const data = {
  title: 'Customer Satisfaction Survey',
  questions: [
    {
      id: 'q1',
      type: 'nps',
      text: 'How likely are you to recommend us?',
      required: true,
    },
  ],
  targeting: {
    type: 'all_users',
  },
};

const result = validateQuestionnaire(data);

if (result.success) {
  // Data is valid, use result.data
  console.log('Valid questionnaire:', result.data);
} else {
  // Display errors to user
  console.error('Validation errors:', result.errors);
  console.error('Field-specific errors:', result.fieldErrors);
}
```

### React Hook Form Integration

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  questionnaireFormSchema,
  type QuestionnaireFormInput,
} from '@/lib/validations/questionnaire-validation';

function QuestionnaireForm() {
  const form = useForm<QuestionnaireFormInput>({
    resolver: zodResolver(questionnaireFormSchema),
    defaultValues: {
      title: '',
      questions: [],
      targetingType: 'all_users',
      selectedPanels: [],
      anonymous: false,
      responseLimit: 1,
    },
  });

  const onSubmit = (data: QuestionnaireFormInput) => {
    // Transform form data to API payload
    const payload = transformFormToApiPayload(data);
    // Send to API...
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
}
```

### Individual Question Validation

```typescript
import { validateQuestion } from '@/lib/validations/questionnaire-validation';

const question = {
  id: 'q1',
  type: 'mcq_single',
  text: 'Choose your preference',
  required: true,
  config: {
    options: ['Option A', 'Option B', 'Option C'],
  },
};

const result = validateQuestion(question);

if (!result.success) {
  console.error('Question validation errors:', result.errors);
}
```

### Transform Form Data to API Payload

```typescript
import {
  transformFormToApiPayload,
  type QuestionnaireFormInput,
} from '@/lib/validations/questionnaire-validation';

const formData: QuestionnaireFormInput = {
  title: 'Survey',
  questions: [/* ... */],
  targetingType: 'specific_panels',
  selectedPanels: ['pan_123', 'pan_456'],
  // ... other fields
};

// Convert form state to API-ready payload
const apiPayload = transformFormToApiPayload(formData);
// apiPayload now has the correct structure for the API
```

## Type Guards

```typescript
import { isMcqQuestion, hasMcqOptions } from '@/lib/validations/questionnaire-validation';

// Check if a question is an MCQ type
if (isMcqQuestion(question)) {
  // TypeScript knows question is mcq_single or mcq_multiple
  console.log('MCQ options:', question.config.options);
}

// Check if config has options
if (hasMcqOptions(config)) {
  // TypeScript knows config has options array
  console.log('Options count:', config.options.length);
}
```

## Error Handling

The validation functions return structured error objects:

```typescript
{
  success: false,
  errors: [
    "title: Title must be at least 3 characters",
    "questions: At least one question is required",
    "targeting.panelIds: At least one panel must be selected"
  ],
  fieldErrors: {
    "title": ["Title must be at least 3 characters"],
    "questions": ["At least one question is required"],
    "targeting.panelIds": ["At least one panel must be selected"]
  }
}
```

Use `errors` for displaying a summary list of all errors, and `fieldErrors` for field-specific error messages in the UI.

## Testing

Run the test suite:

```bash
npm test -- src/lib/validations/__tests__/questionnaire-validation.test.ts
```

All 49 tests should pass, covering:

- ✅ Basic question validation (text, MCQ, Likert, NPS, rating)
- ✅ MCQ option count and uniqueness
- ✅ Targeting type validation
- ✅ Date range validation
- ✅ Max responses validation
- ✅ Form-to-API transformation
- ✅ Type guards

## Best Practices

1. **Always use schemas for form validation** - Don't create custom validation logic when a schema exists
2. **Use `transformFormToApiPayload`** - Always transform form data before sending to API
3. **Display field-specific errors** - Use `fieldErrors` for inline validation messages
4. **Validate early** - Validate on blur or change for better UX
5. **Test your forms** - Write integration tests using the validation schemas

## Related Files

- **Types**: `src/types/questionnaire.ts` - TypeScript interfaces
- **Legacy Validation**: `src/lib/validation/questionnaire-validation.ts` - Original validation functions (being migrated)
- **Form Components**: `src/components/questionnaires/questionnaire-create-form.tsx`
- **API Routes**: `src/app/api/questionnaires/route.ts`

## Schema Reference

### Available Schemas

| Schema | Purpose | Use Case |
|--------|---------|----------|
| `questionSchema` | Validate single question | Adding/editing questions |
| `targetingSchema` | Validate targeting config | Audience selection |
| `createQuestionnaireSchema` | Validate API payload | API endpoint validation |
| `updateQuestionnaireSchema` | Validate update payload | Edit questionnaire API |
| `questionnaireFormSchema` | Validate form state | React Hook Form |

### Available Types

| Type | Purpose |
|------|---------|
| `QuestionInput` | Single question data |
| `TargetingInput` | Targeting configuration |
| `CreateQuestionnaireInput` | API create payload |
| `UpdateQuestionnaireInput` | API update payload |
| `QuestionnaireFormInput` | Form state type |
| `QuestionType` | Question type enum |
| `TargetingType` | Targeting type enum |

## Migration Guide

If migrating from the legacy validation functions in `src/lib/validation/questionnaire-validation.ts`:

### Before (Legacy)

```typescript
import { validateQuestionnaireForm } from '@/lib/validation/questionnaire-validation';

const result = validateQuestionnaireForm({
  title,
  questions,
  targetingType,
  selectedPanels,
  // ...
});

if (!result.isValid) {
  console.error(result.error);
}
```

### After (Zod)

```typescript
import { validateQuestionnaireForm } from '@/lib/validations/questionnaire-validation';

const result = validateQuestionnaireForm({
  title,
  questions,
  targetingType,
  selectedPanels,
  // ...
});

if (!result.success) {
  console.error(result.errors); // Array of all errors
  console.error(result.fieldErrors); // Field-specific errors
}
```

## Contributing

When adding new validation rules:

1. **Update the schema** in `questionnaire-validation.ts`
2. **Add tests** in `__tests__/questionnaire-validation.test.ts`
3. **Update this README** with the new rules
4. **Update related documentation** (API docs, user guides)

## Support

For questions or issues:

1. Check this README
2. Review test cases for examples
3. Check the DSL spec: `docs/dsl/global.yaml` (lines 174-202)
4. Review the implementation in questionnaire forms

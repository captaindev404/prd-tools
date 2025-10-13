# Task #37 Completion Report: Zod-based Questionnaire Validation

**Task ID**: TASK-037
**Epic**: A12 - Research: Questionnaires
**Status**: ✅ Complete
**Completed**: 2025-10-13

## Summary

Implemented comprehensive Zod-based validation schemas for the questionnaire creation and management system, providing type-safe form validation with React Hook Form integration.

## What Was Built

### 1. Core Validation Module

**File**: `src/lib/validations/questionnaire-validation.ts`

A comprehensive Zod validation module with:

- **Enums & Constants**:
  - Question types (text, mcq_single, mcq_multiple, likert, nps, rating, number)
  - Targeting types (all_users, specific_panels, specific_villages, by_role)
  - Validation constants (min/max lengths, MCQ option limits)

- **Question Config Schemas**:
  - `likertConfigSchema` - Likert scale (5 or 7 point) with optional labels
  - `npsConfigSchema` - NPS questions (0-10 scale)
  - `mcqConfigSchema` - MCQ with 2+ unique options validation
  - `textConfigSchema` - Text questions with maxLength and multiline options
  - `numberConfigSchema` - Number questions with min/max bounds
  - `ratingConfigSchema` - Star rating (3-10 stars, default 5)

- **Main Schemas**:
  - `questionSchema` - Validates individual questions with type-specific config
  - `targetingSchema` - Validates targeting configuration with conditional rules
  - `createQuestionnaireSchema` - API payload validation for creation
  - `updateQuestionnaireSchema` - API payload validation for updates
  - `questionnaireFormSchema` - Form state validation for React Hook Form

- **Helper Functions**:
  - `validateQuestionnaire(data)` - Validates and returns formatted errors
  - `validateQuestionnaireForm(data)` - Validates form data
  - `validateQuestion(data)` - Validates single question
  - `transformFormToApiPayload(formData)` - Transforms form state to API format

- **Type Guards**:
  - `isMcqQuestion(question)` - Checks if question is MCQ type
  - `hasMcqOptions(config)` - Checks if config has options array

### 2. Comprehensive Test Suite

**File**: `src/lib/validations/__tests__/questionnaire-validation.test.ts`

49 unit tests covering:

- ✅ Question validation (all types)
- ✅ MCQ option count (min 2 options)
- ✅ MCQ option uniqueness (case-insensitive)
- ✅ Targeting validation (all types with conditional rules)
- ✅ Date range validation (end after start)
- ✅ Max responses validation (positive integer)
- ✅ Title validation (3-200 characters)
- ✅ Form data transformation
- ✅ Type guard functions
- ✅ Error message formatting

**Test Results**: All 49 tests passing ✅

### 3. Documentation

**File**: `src/lib/validations/README.md`

Comprehensive documentation including:

- Overview of validation system
- Complete validation rules reference
- Usage examples (basic, React Hook Form, individual validation)
- Error handling patterns
- Type guard usage
- Migration guide from legacy validation
- Schema reference table
- Best practices

### 4. Type Definitions Enhancement

**File**: `src/types/questionnaire.ts` (updated)

Added cross-reference comment linking to Zod schemas for form validation.

## Validation Rules Implemented

### Title
- ✅ Required
- ✅ Min length: 3 characters
- ✅ Max length: 200 characters
- ✅ Whitespace trimmed automatically

### Questions
- ✅ At least 1 question required
- ✅ Unique question IDs
- ✅ Valid question types
- ✅ Text: 5-500 characters
- ✅ Required flag validation

### MCQ Questions
- ✅ Minimum 2 options
- ✅ Options must be unique (case-insensitive)
- ✅ Each option: 1-200 characters
- ✅ No empty options

### Targeting
- ✅ Valid targeting type
- ✅ Conditional validation based on type:
  - specific_panels → at least 1 panel ID
  - specific_villages → at least 1 village ID
  - by_role → at least 1 role

### Date Range
- ✅ Optional fields
- ✅ Valid ISO datetime format
- ✅ End date must be after start date

### Max Responses
- ✅ Optional positive integer
- ✅ Cannot be zero or negative

## Integration Points

### React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { questionnaireFormSchema } from '@/lib/validations/questionnaire-validation';

const form = useForm({
  resolver: zodResolver(questionnaireFormSchema),
  // ... config
});
```

### API Validation

```typescript
import { validateQuestionnaire } from '@/lib/validations/questionnaire-validation';

// In API route
const result = validateQuestionnaire(requestData);
if (!result.success) {
  return NextResponse.json({ errors: result.errors }, { status: 400 });
}
```

## Files Created

1. `/src/lib/validations/questionnaire-validation.ts` - Main validation module (618 lines)
2. `/src/lib/validations/__tests__/questionnaire-validation.test.ts` - Test suite (815 lines)
3. `/src/lib/validations/README.md` - Documentation (350 lines)
4. `/docs/tasks/TASK-037-COMPLETION.md` - This completion report

## Files Modified

1. `/src/types/questionnaire.ts` - Added cross-reference comment to Zod schemas

## Dependencies

All dependencies already installed:

- `zod@4.1.11` - Runtime validation
- `@hookform/resolvers` - React Hook Form integration
- `react-hook-form` - Form state management
- `jest` - Testing framework

## Testing

```bash
npm test -- src/lib/validations/__tests__/questionnaire-validation.test.ts
```

**Result**: ✅ All 49 tests passing

## Acceptance Criteria

✅ All validation rules implemented
✅ Zod schemas properly typed
✅ Validate function returns helpful error messages
✅ Field-level and form-level validation
✅ Integration with React Hook Form
✅ Comprehensive test coverage
✅ Documentation complete

## Next Steps

1. **Integrate with questionnaire forms**:
   - Update `src/components/questionnaires/questionnaire-create-form.tsx` to use Zod schemas
   - Update `src/components/questionnaires/questionnaire-edit-form.tsx`

2. **Update API routes**:
   - Use Zod schemas for server-side validation in `/api/questionnaires/route.ts`

3. **Migrate from legacy validation**:
   - Gradually replace old validation functions in `src/lib/validation/questionnaire-validation.ts`
   - Keep both during transition period for backwards compatibility

4. **Add validation to other forms**:
   - Apply similar patterns to panel forms
   - Apply to session forms
   - Apply to feedback forms

## Notes

- The validation system is designed to work alongside the existing legacy validation functions during migration
- All Zod schemas follow the DSL specification in `docs/dsl/global.yaml` (lines 174-202)
- The system is English-only as per v0.6.0 simplification (bilingual support removed)
- Type inference from Zod schemas provides compile-time type safety
- Error messages are user-friendly and suitable for display in the UI

## Related Tasks

- TASK-038: Questionnaire Builder UI (depends on this task)
- TASK-039: Question Type Components
- TASK-040: Questionnaire Preview
- TASK-041: Questionnaire Publishing

## References

- DSL Spec: `docs/dsl/global.yaml` (lines 174-202)
- Zod Documentation: https://zod.dev/
- React Hook Form + Zod: https://react-hook-form.com/docs/useform#resolver
- Task Definition: `tools/populate_tasks.sql` (TASK-037)

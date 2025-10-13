# TASK-050: Question Types Testing Guide

## Overview
This guide provides comprehensive testing procedures for all 7 question types supported in the questionnaire creation form.

**Version**: 0.6.0 (English-only MVP)
**Date**: 2025-10-13
**Tester**: Claude Code Agent

---

## Question Types

The questionnaire builder supports 7 distinct question types:

1. **Likert Scale** - 5-point or 7-point scale (Strongly Disagree to Strongly Agree)
2. **NPS** - Net Promoter Score (0-10 rating)
3. **MCQ Single** - Multiple Choice, single selection (radio buttons)
4. **MCQ Multiple** - Multiple Choice, multiple selections (checkboxes)
5. **Text** - Open-ended text input
6. **Number** - Numeric input with optional min/max constraints
7. **Rating** - Star rating (3, 5, 7, or 10 stars)

---

## Testing Checklist

### General Testing Steps (For Each Question Type)

For each question type, complete the following tests:

- [ ] **Creation**: Question can be added via QuestionBuilder
- [ ] **Configuration**: Type-specific options work correctly
- [ ] **Required Toggle**: Required field checkbox works
- [ ] **Validation**: Empty question text is rejected
- [ ] **Reordering**: Move up/down buttons work correctly
- [ ] **Duplication**: Duplicate button creates a copy
- [ ] **Deletion**: Delete button removes the question
- [ ] **Draft Save**: Question saves correctly in draft mode
- [ ] **Preview**: Question displays correctly in preview modal
- [ ] **Publish**: Question publishes successfully

---

## Test Cases by Question Type

### 1. Likert Scale

**Purpose**: Measure agreement/disagreement on a statement

**Configuration Options**:
- Scale: 5-point or 7-point

**Test Procedure**:

1. **Add Likert Question**
   - Select "Likert Scale" from dropdown
   - Click "Add Question"
   - Expected: New question card appears with "LIKERT" label

2. **Enter Question Text**
   - Text: "The new reservation system is easy to use"
   - Expected: Text appears in textarea

3. **Test Scale Configuration**
   - Default should be: 5-point scale
   - Change to: 7-point scale
   - Expected: Dropdown value updates

4. **Toggle Required**
   - Check "Required question" checkbox
   - Expected: Checkbox state updates

5. **Save as Draft**
   - Click "Save as Draft"
   - Expected: Success toast, redirect to analytics page

6. **Preview Mode**
   - Click "Preview" button
   - Expected: Modal shows Likert scale with appropriate labels
   - For 5-point: Labels should range from "Strongly Disagree" to "Strongly Agree"
   - For 7-point: Extended scale with additional options

**Validation Tests**:
- [ ] Empty question text rejected
- [ ] Scale change persists after save
- [ ] Required toggle persists after save

---

### 2. NPS (Net Promoter Score)

**Purpose**: Measure customer loyalty and satisfaction

**Configuration Options**:
- Fixed scale: 0-10

**Test Procedure**:

1. **Add NPS Question**
   - Select "NPS (0-10)" from dropdown
   - Click "Add Question"
   - Expected: New question card appears with "NPS" label

2. **Enter Question Text**
   - Text: "How likely are you to recommend Club Med to a friend or colleague?"
   - Expected: Text appears in textarea

3. **Toggle Required**
   - Check "Required question" checkbox
   - Expected: Checkbox state updates

4. **Save as Draft**
   - Click "Save as Draft"
   - Expected: Success toast, redirect to analytics page

5. **Preview Mode**
   - Click "Preview" button
   - Expected: Modal shows 0-10 scale
   - Labels: "Not at all likely" (0) to "Extremely likely" (10)
   - Visual: Buttons or slider showing 11 options (0-10)

**Validation Tests**:
- [ ] Empty question text rejected
- [ ] NPS scale is always 0-10 (no configuration needed)

---

### 3. MCQ Single (Multiple Choice - Single Selection)

**Purpose**: Choose one option from a list

**Configuration Options**:
- Options: List of choices (minimum 2 required)

**Test Procedure**:

1. **Add MCQ Single Question**
   - Select "Multiple Choice (Single)" from dropdown
   - Click "Add Question"
   - Expected: New question card appears with "MCQ SINGLE" label

2. **Enter Question Text**
   - Text: "What is your primary role at Club Med?"
   - Expected: Text appears in textarea

3. **Configure Options**
   - Enter options (one per line):
     ```
     Front Desk Agent
     Guest Relations
     F&B Service
     Housekeeping
     Management
     Other
     ```
   - Expected: Textarea displays options on separate lines

4. **Toggle Required**
   - Check "Required question" checkbox
   - Expected: Checkbox state updates

5. **Save as Draft**
   - Click "Save as Draft"
   - Expected: Success toast, redirect to analytics page

6. **Preview Mode**
   - Click "Preview" button
   - Expected: Modal shows radio buttons with all 6 options
   - Behavior: Only one option can be selected at a time

**Validation Tests**:
- [ ] Empty question text rejected
- [ ] Less than 2 options rejected with error: "Question X (Multiple Choice) must have at least 2 options"
- [ ] Options persist after save
- [ ] Line breaks properly separate options

**Edge Cases**:
- Empty lines in options field (should be filtered out)
- Very long option text (should wrap properly)

---

### 4. MCQ Multiple (Multiple Choice - Multiple Selections)

**Purpose**: Choose multiple options from a list

**Configuration Options**:
- Options: List of choices (minimum 2 required)

**Test Procedure**:

1. **Add MCQ Multiple Question**
   - Select "Multiple Choice (Multiple)" from dropdown
   - Click "Add Question"
   - Expected: New question card appears with "MCQ MULTIPLE" label

2. **Enter Question Text**
   - Text: "Which Club Med services have you used in the past month? (Select all that apply)"
   - Expected: Text appears in textarea

3. **Configure Options**
   - Enter options (one per line):
     ```
     Resort reservations
     Guest check-in
     Spa services
     Activities booking
     Restaurant reservations
     Concierge services
     None of the above
     ```
   - Expected: Textarea displays options on separate lines

4. **Toggle Required**
   - Check "Required question" checkbox
   - Expected: Checkbox state updates

5. **Save as Draft**
   - Click "Save as Draft"
   - Expected: Success toast, redirect to analytics page

6. **Preview Mode**
   - Click "Preview" button
   - Expected: Modal shows checkboxes with all 7 options
   - Behavior: Multiple options can be selected simultaneously

**Validation Tests**:
- [ ] Empty question text rejected
- [ ] Less than 2 options rejected with error: "Question X (Multiple Choice) must have at least 2 options"
- [ ] Options persist after save
- [ ] Line breaks properly separate options

**Edge Cases**:
- Empty lines in options field (should be filtered out)
- Many options (10+) should still display correctly

---

### 5. Text (Open-Ended Text Response)

**Purpose**: Collect detailed text feedback

**Configuration Options**:
- Max Length: Optional character limit

**Test Procedure**:

1. **Add Text Question**
   - Select "Text Response" from dropdown
   - Click "Add Question"
   - Expected: New question card appears with "TEXT" label

2. **Enter Question Text**
   - Text: "Please describe your experience with the new mobile check-in feature"
   - Expected: Text appears in textarea

3. **Configure Max Length (Optional)**
   - Enter max length: 500
   - Expected: Value appears in input field
   - Test clearing: Remove value
   - Expected: Field becomes empty (no limit)

4. **Toggle Required**
   - Check "Required question" checkbox
   - Expected: Checkbox state updates

5. **Save as Draft**
   - Click "Save as Draft"
   - Expected: Success toast, redirect to analytics page

6. **Preview Mode**
   - Click "Preview" button
   - Expected: Modal shows large textarea
   - If max length set: Shows character counter (e.g., "0/500")

**Validation Tests**:
- [ ] Empty question text rejected
- [ ] Max length (when set) enforces character limit
- [ ] Max length (when empty) allows unlimited text
- [ ] Max length persists after save

**Edge Cases**:
- Negative max length (should be rejected or ignored)
- Very large max length (e.g., 10,000)

---

### 6. Number (Numeric Input)

**Purpose**: Collect numeric data with optional constraints

**Configuration Options**:
- Min Value: Optional minimum number
- Max Value: Optional maximum number

**Test Procedure**:

1. **Add Number Question**
   - Select "Number Input" from dropdown
   - Click "Add Question"
   - Expected: New question card appears with "NUMBER" label

2. **Enter Question Text**
   - Text: "How many years have you worked at Club Med?"
   - Expected: Text appears in textarea

3. **Configure Min/Max Values**
   - Enter min value: 0
   - Enter max value: 50
   - Expected: Values appear in respective fields
   - Test clearing: Remove min value
   - Expected: Min field becomes empty (no minimum)

4. **Toggle Required**
   - Check "Required question" checkbox
   - Expected: Checkbox state updates

5. **Save as Draft**
   - Click "Save as Draft"
   - Expected: Success toast, redirect to analytics page

6. **Preview Mode**
   - Click "Preview" button
   - Expected: Modal shows number input field
   - Behavior: Only numeric input allowed
   - If min/max set: Shows hint text (e.g., "Between 0 and 50")

**Validation Tests**:
- [ ] Empty question text rejected
- [ ] Min/max constraints saved correctly
- [ ] Min/max constraints enforced in preview/live form

**Edge Cases**:
- Min greater than max (should show validation error)
- Negative numbers
- Decimal numbers
- Very large numbers

---

### 7. Rating (Star Rating)

**Purpose**: Quick visual rating system

**Configuration Options**:
- Number of Stars: 3, 5, 7, or 10 stars

**Test Procedure**:

1. **Add Rating Question**
   - Select "Rating (Stars)" from dropdown
   - Click "Add Question"
   - Expected: New question card appears with "RATING" label

2. **Enter Question Text**
   - Text: "How would you rate the speed of the new reservation system?"
   - Expected: Text appears in textarea

3. **Test Star Configuration**
   - Default should be: 5 stars
   - Change to: 3 stars
   - Expected: Dropdown value updates
   - Change to: 7 stars
   - Expected: Dropdown value updates
   - Change to: 10 stars
   - Expected: Dropdown value updates

4. **Toggle Required**
   - Check "Required question" checkbox
   - Expected: Checkbox state updates

5. **Save as Draft**
   - Click "Save as Draft"
   - Expected: Success toast, redirect to analytics page

6. **Preview Mode**
   - Click "Preview" button
   - Expected: Modal shows star rating component with configured number of stars
   - Behavior: Clicking/hovering highlights stars up to selection

**Validation Tests**:
- [ ] Empty question text rejected
- [ ] Star count configuration persists after save
- [ ] Different star counts display correctly (3, 5, 7, 10)

---

## Advanced Testing Scenarios

### Scenario 1: Complex Multi-Type Questionnaire

**Objective**: Test creating a questionnaire with all 7 question types

**Steps**:
1. Create new questionnaire titled "Complete Product Survey"
2. Add one question of each type in this order:
   - Likert (5-point): "The reservation system is intuitive"
   - NPS: "How likely are you to recommend this system?"
   - MCQ Single: "Your primary department"
   - MCQ Multiple: "Features you use regularly"
   - Text: "Additional feedback"
   - Number: "Years of experience"
   - Rating (5-star): "Overall system rating"
3. Make questions 1, 2, 3, 6, and 7 required
4. Save as draft
5. Preview to verify all questions display correctly
6. Publish

**Expected Results**:
- All 7 questions save successfully
- Question order is maintained
- Required flags are preserved
- Preview shows all questions correctly
- Publish succeeds

---

### Scenario 2: Question Reordering

**Objective**: Test moving questions up and down

**Steps**:
1. Create questionnaire with 5 questions (any types)
2. Move question 3 to position 1 (click "Move up" twice)
3. Move question 5 to position 3 (click "Move up" twice)
4. Save as draft
5. Reload/preview to verify order

**Expected Results**:
- Questions reorder in real-time
- Move up disabled for first question
- Move down disabled for last question
- Order persists after save

---

### Scenario 3: Question Duplication

**Objective**: Test duplicating questions

**Steps**:
1. Create Likert question with specific text and configuration
2. Click "Duplicate" button
3. Modify duplicated question text
4. Save as draft

**Expected Results**:
- Duplicate has same type and configuration
- Duplicate has unique ID
- Both questions save independently

---

### Scenario 4: Validation Edge Cases

**Objective**: Test form validation

**Steps**:
1. Try to save with no title → Error: "Title is required"
2. Try to save with title < 3 chars → Error: "Title must be at least 3 characters"
3. Try to save with no questions → Error: "At least one question is required"
4. Add MCQ Single with only 1 option → Error: "Question X must have at least 2 options"
5. Add question with empty text → Error: "Question X must have text"

**Expected Results**:
- All validation errors display correctly
- Error messages are specific and helpful
- Form does not submit when invalid

---

## Accessibility Testing

### Keyboard Navigation

- [ ] Tab through all form fields in logical order
- [ ] Space/Enter to check checkboxes
- [ ] Arrow keys to navigate select dropdowns
- [ ] Shift+Tab to navigate backwards
- [ ] Ctrl/Cmd+Enter to save as draft (keyboard shortcut)
- [ ] Escape to cancel (keyboard shortcut)

### Screen Reader Testing

- [ ] Form has proper ARIA labels
- [ ] Error messages announced by screen readers
- [ ] Status updates announced (loading, success)
- [ ] Question count announced when questions added/removed
- [ ] Required fields indicated with "required" label

### Visual Accessibility

- [ ] Minimum touch target size: 44x44px for buttons
- [ ] Sufficient color contrast for text
- [ ] Focus indicators visible on all interactive elements
- [ ] Error states have visual indicators (not just color)

---

## Performance Testing

### Load Testing

- [ ] Create questionnaire with 50 questions
- [ ] Preview modal opens without lag
- [ ] Reordering questions is responsive
- [ ] Form submit handles large payload

### Mobile Responsiveness

- [ ] Test on mobile viewport (375px width)
- [ ] All form fields usable on touch devices
- [ ] Buttons meet minimum touch target size
- [ ] Preview modal responsive on small screens

---

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Bug Reporting Template

When a bug is found, document using this template:

```markdown
### Bug: [Brief Description]

**Question Type**: [Likert/NPS/MCQ Single/etc.]
**Severity**: [Critical/High/Medium/Low]
**Steps to Reproduce**:
1.
2.
3.

**Expected Behavior**:

**Actual Behavior**:

**Screenshots**: [If applicable]

**Environment**:
- Browser:
- OS:
- Version:
```

---

## Test Results Summary Template

```markdown
## Test Results: [Date]

### Overall Status: [Pass/Fail/Partial]

### Question Types Tested: [X/7]

#### 1. Likert Scale: [✓/✗]
- Issues found:
- Notes:

#### 2. NPS: [✓/✗]
- Issues found:
- Notes:

[Continue for all types...]

### Critical Issues:
1.

### Medium/Low Issues:
1.

### Recommendations:
1.
```

---

## Notes for Manual Testers

1. **Take Screenshots**: Document each question type in action
2. **Test Edge Cases**: Try unusual inputs (very long text, special characters, etc.)
3. **Verify Persistence**: After each save, verify data persists correctly
4. **Check Console**: Monitor browser console for errors
5. **Test All Paths**: Draft save, preview, and publish all need testing

---

## Success Criteria

All tests pass when:
- [ ] All 7 question types can be created
- [ ] All configuration options work correctly
- [ ] Required field toggle works
- [ ] Questions save in draft mode
- [ ] Questions display correctly in preview
- [ ] Questions publish successfully
- [ ] No console errors
- [ ] Validation messages are clear and helpful
- [ ] Accessibility requirements met
- [ ] Mobile responsive

---

## References

- **Component**: `/src/components/questionnaires/question-builder.tsx`
- **Form**: `/src/components/questionnaires/questionnaire-create-form.tsx`
- **Page**: `/src/app/(authenticated)/research/questionnaires/new/page.tsx`
- **API**: `/src/app/api/questionnaires/route.ts`
- **DSL**: `/dsl/global.yaml` (lines 153-215)

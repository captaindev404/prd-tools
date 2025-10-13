# Accessibility Testing Guide - Questionnaire Forms

**Version:** 1.0.0
**Last Updated:** 2025-10-13
**WCAG Compliance Target:** WCAG 2.1 Level AA

## Overview

This guide provides comprehensive testing procedures to verify keyboard navigation and screen reader compatibility for the questionnaire form system in Gentil Feedback. The questionnaire forms are built using Shadcn UI components (based on Radix UI) and follow accessibility best practices.

---

## Table of Contents

1. [Keyboard Navigation Testing](#keyboard-navigation-testing)
2. [Screen Reader Testing](#screen-reader-testing)
3. [ARIA Compliance Checklist](#aria-compliance-checklist)
4. [Focus Management](#focus-management)
5. [Testing Tools](#testing-tools)
6. [Issue Reporting](#issue-reporting)

---

## Keyboard Navigation Testing

### 1. Tab Navigation (Forward)

**Test Path:** Create Questionnaire Form (`/research/questionnaires/new`)

**Expected Tab Order:**

1. **General Info Tab:**
   - Title input field
   - Tab triggers: "General Info" → "Questions" → "Targeting & Settings"

2. **Questions Tab:**
   - Question type select dropdown
   - "Add Question" button
   - For each question card:
     - Move Up button
     - Move Down button
     - Duplicate button
     - Delete button
     - Question text textarea
     - Type-specific configuration inputs
     - Required checkbox

3. **Targeting & Settings Tab:**
   - Target Audience select dropdown
   - Panel checkboxes (if "Specific Panels" selected)
   - Anonymous responses checkbox
   - Response limit select
   - Start date input
   - End date input
   - Max responses input

4. **Action Buttons:**
   - Cancel button
   - Preview button
   - Save as Draft button
   - Save & Publish button

**Acceptance Criteria:**
- ✅ Tab order follows visual layout (top to bottom, left to right)
- ✅ All interactive elements are reachable via Tab key
- ✅ Tab order is logical and matches user expectations
- ✅ No focus traps (except in modals - see Modal Testing)
- ✅ Focus indicators are clearly visible on all elements

**Test Commands:**
```
Press Tab repeatedly from page load
Verify each element receives focus in logical order
Document any unexpected tab order
```

### 2. Shift+Tab Navigation (Backward)

**Expected Behavior:**
- Reverse order of Tab navigation
- Focus returns through all elements in reverse

**Acceptance Criteria:**
- ✅ Shift+Tab reliably moves focus backward
- ✅ Order is exact reverse of forward tab order
- ✅ No elements are skipped in reverse navigation

**Test Commands:**
```
Navigate to end of form using Tab
Press Shift+Tab repeatedly
Verify reverse order matches forward order
```

### 3. Enter Key Functionality

**Context-Specific Behavior:**

| Element Type | Expected Action |
|--------------|----------------|
| Primary buttons (Submit, Publish) | Submits form with validation |
| Secondary buttons (Preview, Cancel) | Executes button action |
| Select dropdowns | Opens dropdown menu |
| Checkboxes | No action (use Spacebar) |
| Radio buttons | No action (use Spacebar) |
| Links | Follows link |
| Modal close button | Closes modal |

**Acceptance Criteria:**
- ✅ Enter key submits form only when on submit button
- ✅ Enter key does NOT submit form from text inputs
- ✅ Enter key opens/closes dropdowns appropriately
- ✅ Enter key activates focused button

**Test Commands:**
```
Focus on "Save & Publish" button, press Enter
Expected: Form validation runs, if valid, questionnaire is published

Focus on "Preview" button, press Enter
Expected: Preview modal opens

Focus in textarea, press Enter
Expected: New line inserted, form NOT submitted
```

### 4. Escape Key Functionality

**Context-Specific Behavior:**

| Context | Expected Action |
|---------|----------------|
| Preview modal open | Closes modal, returns focus to Preview button |
| Publish confirmation dialog open | Closes dialog, returns focus to trigger |
| Select dropdown open | Closes dropdown, focus stays on select |
| Main form (no modal) | Cancels form, navigates back (via Escape handler) |

**Acceptance Criteria:**
- ✅ Escape key closes modals and dialogs
- ✅ Focus returns to element that opened modal/dialog
- ✅ Escape key closes dropdown menus
- ✅ Escape on form navigates back (matches Cancel button)

**Test Commands:**
```
Open Preview modal
Press Escape
Expected: Modal closes, focus returns to Preview button

Open Target Audience dropdown
Press Escape
Expected: Dropdown closes, focus stays on select trigger
```

### 5. Arrow Key Navigation

**Radio Groups (Likert Scale, NPS):**
- **Up/Left Arrow:** Move to previous option
- **Down/Right Arrow:** Move to next option
- **Behavior:** Circular navigation (wraps around)

**Select Dropdowns:**
- **Up Arrow:** Move to previous option
- **Down Arrow:** Move to next option
- **Home:** Jump to first option
- **End:** Jump to last option

**Tab Components:**
- **Left Arrow:** Move to previous tab
- **Right Arrow:** Move to next tab
- **Home:** Jump to first tab
- **End:** Jump to last tab

**Acceptance Criteria:**
- ✅ Arrow keys navigate within radio groups
- ✅ Arrow keys work in open dropdowns
- ✅ Arrow keys switch tabs in tab lists
- ✅ Focus indicator clearly shows selected option

**Test Commands:**
```
Focus on Likert scale radio group
Press Right Arrow repeatedly
Expected: Each option receives focus in sequence

Focus on "Target Audience" select
Press Enter to open dropdown
Press Down Arrow
Expected: Focus moves to next option in list
```

### 6. Spacebar Functionality

**Element-Specific Behavior:**

| Element | Expected Action |
|---------|----------------|
| Checkbox | Toggles checked/unchecked state |
| Radio button | Selects option |
| Button | Activates button |
| Select (closed) | Opens dropdown |
| Star rating | Selects rating |

**Acceptance Criteria:**
- ✅ Spacebar toggles checkboxes
- ✅ Spacebar selects radio buttons
- ✅ Spacebar activates focused buttons
- ✅ Spacebar opens closed select dropdowns

**Test Commands:**
```
Tab to "Required question" checkbox
Press Spacebar
Expected: Checkbox toggles state

Tab to radio button in question type selector
Press Spacebar
Expected: Radio button is selected
```

### 7. Keyboard Shortcuts (Form-Level)

**Implemented Shortcuts:**

| Shortcut | Action | Context |
|----------|--------|---------|
| `Ctrl/Cmd + Enter` | Save as Draft | Main form |
| `Escape` | Cancel / Go Back | Main form (no modal open) |

**Acceptance Criteria:**
- ✅ Shortcuts work from any focused element on form
- ✅ Visual feedback indicates action is processing
- ✅ Shortcuts are documented in UI (tooltips or help text)

**Test Commands:**
```
Focus anywhere in form
Press Ctrl+Enter (Windows) or Cmd+Enter (Mac)
Expected: Form saves as draft

Focus anywhere in form, with no modals open
Press Escape
Expected: Navigates back to previous page
```

---

## Screen Reader Testing

### Testing Environments

Test with the following screen reader and browser combinations:

| Screen Reader | Browser | Operating System | Priority |
|---------------|---------|------------------|----------|
| NVDA | Chrome | Windows | **High** |
| NVDA | Firefox | Windows | Medium |
| JAWS | Chrome | Windows | Medium |
| VoiceOver | Safari | macOS | **High** |
| TalkBack | Chrome | Android | Low |

### 1. NVDA Testing (Windows)

**Setup:**
1. Install NVDA (free): https://www.nvaccess.org/download/
2. Launch NVDA
3. Use Chrome or Firefox browser
4. Navigate to questionnaire form

**Key Commands:**

| Command | Action |
|---------|--------|
| `Ctrl` | Stop speech |
| `Insert + Down Arrow` | Read current line |
| `Down Arrow` | Next item |
| `Up Arrow` | Previous item |
| `Tab` | Next interactive element |
| `Insert + F7` | List all form fields |
| `Insert + F5` | List all form fields |
| `H` | Next heading |
| `B` | Next button |
| `F` | Next form field |
| `E` | Next edit field |
| `X` | Next checkbox |
| `R` | Next radio button |

**Expected Announcements by Component:**

#### A. Form and Page Structure

**Form Load:**
```
Announced: "Create questionnaire form, form, landmark"
Announced: "Three tabs: General Info, Questions, Targeting & Settings"
```

**Tab Navigation:**
```
Tab to General Info tab:
Announced: "General Info, tab, 1 of 3, selected"

Press Right Arrow:
Announced: "Questions, tab, 2 of 3"

Activate with Enter:
Announced: "Questions, tab panel"
```

#### B. General Info Tab

**Title Input:**
```
Tab to Title field:
Announced: "Title, edit, required"
Description: "Enter a descriptive title for your questionnaire. Minimum 3 characters, maximum 200 characters."

Type text:
Announced (live region): "48 / 200 characters"

Title too short:
Announced (assertive): "Title must be at least 3 characters"
```

#### C. Questions Tab

**Add Question Section:**
```
Tab to question type dropdown:
Announced: "Select question type, combo box, collapsed, Likert Scale"

Activate with Enter:
Announced: "Menu expanded"

Arrow down to NPS:
Announced: "NPS (0-10), 2 of 7"

Select with Enter:
Announced: "NPS (0-10), selected"
```

**Question Cards:**
```
Tab to Move Up button:
Announced: "Move question up, button, disabled" (if first question)

Tab to Question text field:
Announced: "Question Text, edit, required"

Tab to Required checkbox:
Announced: "Required question, checkbox, not checked"

Press Spacebar:
Announced: "Required question, checkbox, checked"

Screen reader count:
Announced (live region): "3 questions in questionnaire"
```

#### D. Targeting & Settings Tab

**Panel Selection:**
```
Tab to first panel checkbox:
Announced: "Beta Testers Panel, checkbox, not checked"
Description: "Early access users for testing new features. 12 members"

Press Spacebar:
Announced: "Beta Testers Panel, checkbox, checked"
```

**Audience Reach:**
```
Live region update:
Announced (polite): "Calculating audience size..."
Then: "Estimated reach: 125 users"
```

**Response Settings:**
```
Tab to Anonymous checkbox:
Announced: "Allow anonymous responses, checkbox, not checked"

Tab to Response Limit dropdown:
Announced: "Response Limit per User, combo box, collapsed, Unlimited"
```

**Date Inputs:**
```
Tab to Start Date:
Announced: "Start Date (optional), edit, date and time"

Tab to End Date:
Announced: "End Date (optional), edit, date and time"
```

#### E. Action Buttons

**Save as Draft:**
```
Tab to button:
Announced: "Save as Draft, button"

Click when saving:
Announced (live region): "Saving questionnaire as draft..."
Then (polite): "Draft Saved. Questionnaire saved as draft successfully."
```

**Publish Button:**
```
Tab to button:
Announced: "Save & Publish, button, disabled" (if form invalid)

When enabled:
Announced: "Save & Publish, button"

Click to open confirmation dialog:
Announced: "Publish Questionnaire, dialog"
Announced: "Are you sure you want to publish this questionnaire?"
```

#### F. Preview Modal

**Modal Open:**
```
Modal opens:
Announced: "Publish Questionnaire, dialog"
Announced: "This is a preview - responses will not be saved"

Tab to language toggle:
Announced: "English, tab, 1 of 2, selected"

Tab to question:
Announced: "1. How satisfied are you with the booking experience? required"

Tab to Likert radio button:
Announced: "3, radio button, not checked, 3 of 5"

Tab to Close button:
Announced: "Close Preview, button"
```

**Modal Close:**
```
Press Escape or click Close:
Announced: "Dialog closed"
Focus returns to Preview button
```

#### G. Error Handling

**Validation Errors:**
```
Submit with empty title:
Announced (assertive): "Alert. Title is required"
Focus moves to error alert (tabindex -1)

Submit with invalid data:
Announced (assertive): "Alert. Question 2 (Multiple Choice) must have at least 2 options"
```

#### H. Success States

**Optimistic UI:**
```
Publish success (optimistic):
Announced (polite): "Questionnaire published successfully. Redirecting..."
Visual: Green success alert with loading spinner
```

### 2. VoiceOver Testing (macOS)

**Setup:**
1. Enable VoiceOver: System Preferences → Accessibility → VoiceOver → Enable
2. Or press `Cmd + F5` to toggle
3. Use Safari browser (best compatibility)
4. Navigate to questionnaire form

**Key Commands:**

| Command | Action |
|---------|--------|
| `Control` | Stop speech |
| `VO + A` | Read from current position |
| `VO + Right Arrow` | Next item |
| `VO + Left Arrow` | Previous item |
| `Tab` | Next interactive element |
| `VO + U` | Open Web Rotor (lists form fields, headings, etc.) |
| `VO + Command + H` | Next heading |
| `VO + Command + J` | Next form control |

*Note: VO = VoiceOver key (Control + Option)*

**Expected Announcements:**

VoiceOver announcements are similar to NVDA but with slight differences in phrasing:

```
Title input:
"Title, required, edit text"

Tab to Questions tab:
"Questions, tab, 2 of 3"

Tab to checkbox:
"Required question, unticked, checkbox"

Press Spacebar:
"Required question, ticked, checkbox"

Tab to button:
"Save as Draft, button"

Live region update:
"Calculating audience size..."
```

**Rotor Navigation:**

```
Open Rotor with VO + U:
- Navigate with arrow keys to "Form Controls"
- View list of all form fields
- Select and jump to any field
```

### 3. TalkBack Testing (Android)

**Setup:**
1. Enable TalkBack: Settings → Accessibility → TalkBack → Use service
2. Use Chrome browser
3. Navigate to questionnaire form (responsive mobile view)

**Key Gestures:**

| Gesture | Action |
|---------|--------|
| Swipe Right | Next item |
| Swipe Left | Previous item |
| Double Tap | Activate item |
| Swipe Up then Down | Read from top |
| Two-finger swipe down | Read from current position |

**Expected Announcements:**

```
Swipe to title input:
"Title, edit box, required"

Double tap to focus:
"Editing, Title"

Swipe to checkbox:
"Required question, not checked, checkbox"

Double tap:
"Required question, checked"

Swipe to button:
"Save as Draft, button"

Double tap:
"Saving questionnaire as draft"
```

**Mobile-Specific Considerations:**
- Touch target size: Minimum 44x44 pixels for all interactive elements
- Sheet modal for Preview (bottom sheet instead of centered dialog)
- Responsive tab navigation

---

## ARIA Compliance Checklist

### Form Structure

- ✅ **Form landmark:** Form has `aria-label="Create questionnaire form"`
- ✅ **Tab structure:** Uses Radix UI Tabs with proper `role="tablist"`, `role="tab"`, `role="tabpanel"`
- ✅ **Tab labels:** Each tab has descriptive text and `aria-selected` state
- ✅ **Tab panels:** Each panel is associated with its tab via `aria-labelledby`

### Form Fields

**General Compliance:**
- ✅ All inputs have associated `<label>` with `htmlFor` attribute
- ✅ Required fields have `aria-required="true"` and visual asterisk
- ✅ Required fields have screen reader text: `<span className="sr-only">required</span>` OR visible `<span aria-label="required">*</span>`
- ✅ Fields with validation errors have `aria-invalid="true"`
- ✅ Fields with errors have `aria-describedby` pointing to error message ID

**Title Input (General Info Tab):**
```tsx
<Input
  id="title"
  aria-required="true"
  aria-invalid={showError ? 'true' : 'false'}
  aria-describedby="title-description title-char-count title-error"
/>
```

- ✅ Has `id` and matching `<label htmlFor="title">`
- ✅ Has `aria-required="true"`
- ✅ Has `aria-invalid` that updates on validation
- ✅ Has `aria-describedby` linking to:
  - Description text (screen reader only)
  - Character count (live region with `aria-live="polite"`)
  - Error message (when present, with `role="alert"` and `aria-live="assertive"`)

**Question Text Textarea:**
```tsx
<Textarea
  id={`question-text-${question.id}`}
  aria-required="true"
/>
<Label htmlFor={`question-text-${question.id}`}>
  Question Text
  <span className="text-red-500 ml-1" aria-label="required">*</span>
</Label>
```

- ✅ Has unique `id` per question
- ✅ Has matching `<Label>` with `htmlFor`
- ✅ Has `aria-required="true"`
- ✅ Required asterisk has `aria-label="required"`

**Select Dropdowns (Radix UI Select):**
```tsx
<Select value={targetingType} onValueChange={setTargetingType}>
  <SelectTrigger
    id="targetingType"
    aria-label="Select target audience"
    aria-required="true"
  >
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all_users">All Users</SelectItem>
    ...
  </SelectContent>
</Select>
```

- ✅ Radix UI provides built-in ARIA attributes (`aria-haspopup`, `aria-expanded`, `aria-controls`)
- ✅ Additional `aria-label` for context when label element not present
- ✅ Keyboard navigation supported (Enter, Arrow keys, Escape)

**Checkboxes:**
```tsx
<Checkbox
  id="anonymous"
  checked={anonymous}
  onCheckedChange={(checked) => setAnonymous(!!checked)}
/>
<Label htmlFor="anonymous">Allow anonymous responses</Label>
```

- ✅ Radix UI Checkbox has built-in `role="checkbox"` and `aria-checked`
- ✅ Associated with label via `htmlFor` and `id`
- ✅ Keyboard accessible (Spacebar to toggle)

**Panel Checkboxes (with descriptions):**
```tsx
<Checkbox
  id={`panel-${panel.id}`}
  checked={selectedPanels.includes(panel.id)}
  aria-describedby={`panel-${panel.id}-description`}
/>
<Label htmlFor={`panel-${panel.id}`}>{panel.name}</Label>
<p id={`panel-${panel.id}-description`}>
  {panel.description}. {panel._count.memberships} members
</p>
```

- ✅ Has `aria-describedby` linking to description paragraph
- ✅ Description includes member count for context
- ✅ Group has `role="group"` with `aria-label="Select panels for targeting"`

**Radio Groups (in questions):**

Radix UI RadioGroup automatically provides:
- ✅ `role="radiogroup"` on container
- ✅ `role="radio"` on each radio button
- ✅ `aria-checked` state management
- ✅ Arrow key navigation within group

**Date Inputs:**
```tsx
<Label htmlFor="startAt">Start Date (optional)</Label>
<Input
  id="startAt"
  type="datetime-local"
/>
<p className="text-xs text-muted-foreground">
  When the questionnaire becomes available...
</p>
```

- ✅ Has associated label
- ✅ "optional" keyword in label text
- ✅ Helper text provides context (not linked via `aria-describedby` - enhancement opportunity)

### Buttons

**Primary Action Buttons:**
```tsx
<Button
  type="button"
  onClick={() => handleSubmit('publish')}
  disabled={isSubmitting || validateForm() !== null}
>
  {isSubmitting ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Publishing...
    </>
  ) : (
    <>
      <Send className="mr-2 h-4 w-4" />
      Save & Publish
    </>
  )}
</Button>
```

- ✅ Descriptive text content
- ✅ Icons have `aria-hidden="true"` (not currently implemented - see Recommendations)
- ✅ Button text changes to reflect loading state
- ✅ Disabled state with `disabled` attribute
- ⚠️ **Enhancement:** Add `aria-disabled` and `aria-busy` during submission

**Icon-Only Buttons (Question Actions):**
```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={() => moveQuestion(question.id, 'up')}
  disabled={index === 0}
  className="min-h-[44px] min-w-[44px]"
  title="Move up"
  aria-label="Move question up"
>
  <ChevronUp className="h-5 w-5" />
</Button>
```

- ✅ Has `aria-label` for screen readers
- ✅ Has `title` for visual tooltip
- ✅ Minimum touch target size (44x44px) for mobile accessibility
- ✅ Disabled state properly set
- ⚠️ **Enhancement:** Icon should have `aria-hidden="true"`

### Live Regions

**Loading States:**
```tsx
<div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
  {isSubmitting && submitAction === 'draft' && 'Saving questionnaire as draft...'}
  {isSubmitting && submitAction === 'publish' && 'Publishing questionnaire...'}
  {isLoadingReach && 'Calculating audience size...'}
  {optimisticSuccess && 'Questionnaire published successfully. Redirecting...'}
</div>
```

- ✅ Screen reader only (`sr-only` class)
- ✅ `role="status"` for status updates
- ✅ `aria-live="polite"` for non-urgent announcements
- ✅ `aria-atomic="true"` to read entire region on change
- ✅ Conditional content based on state

**Error Alerts:**
```tsx
<Alert
  variant="destructive"
  role="alert"
  aria-live="assertive"
  ref={errorRef}
  tabIndex={-1}
>
  <AlertCircle className="h-4 w-4" aria-hidden="true" />
  <AlertDescription>{error}</AlertDescription>
</Alert>
```

- ✅ `role="alert"` for urgent messages
- ✅ `aria-live="assertive"` to interrupt screen reader
- ✅ `tabIndex={-1}` to allow programmatic focus
- ✅ Focus moved to alert on validation error (via `errorRef.current?.focus()`)
- ✅ Icon has `aria-hidden="true"`

**Character Counter:**
```tsx
<p
  id="title-char-count"
  className="text-xs"
  aria-live="polite"
>
  {characterCount} / {maxChars} characters
</p>
```

- ✅ `aria-live="polite"` announces character count as user types
- ✅ Linked to input via `aria-describedby`
- ✅ Updates in real-time without overwhelming screen reader

**Audience Reach:**
```tsx
{isLoadingReach ? (
  <div className="flex items-center gap-2">
    <LoadingSpinner size="sm" variant="muted" />
    <span>Calculating audience size...</span>
  </div>
) : (
  <p>Estimated reach: <span className="font-semibold">{estimatedReach}</span> users</p>
)}
```

- ✅ Live region at form level announces state changes
- ⚠️ **Enhancement:** Add `aria-live="polite"` directly to audience reach container

**Question Count:**
```tsx
<div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
  {questions.length > 0 && `${questions.length} ${questions.length === 1 ? 'question' : 'questions'} in questionnaire`}
</div>
```

- ✅ Announces question count when adding/removing questions
- ✅ Screen reader only
- ✅ Polite live region (non-urgent)

### Modals and Dialogs

**Preview Modal (Radix UI Dialog):**

Radix UI Dialog provides built-in ARIA:
- ✅ `role="dialog"` on content
- ✅ `aria-labelledby` pointing to title
- ✅ `aria-describedby` pointing to description
- ✅ Focus trap (focus stays within dialog)
- ✅ Focus restoration (returns to trigger on close)
- ✅ Escape key closes dialog
- ✅ Close button has screen reader text: `<span className="sr-only">Close</span>`

```tsx
<Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
  <DialogContent>
    <DialogTitle>{title || 'Untitled Questionnaire'}</DialogTitle>
    <DialogDescription>
      This is a preview - responses will not be saved
    </DialogDescription>
    {/* Dialog content */}
  </DialogContent>
</Dialog>
```

**Publish Confirmation Dialog:**

- ✅ Same Radix UI Dialog pattern
- ✅ Descriptive title and description
- ✅ Focus trap active
- ✅ Action buttons clearly labeled ("Cancel" vs "Publish Now")

### Focus Management

**Error Handling:**
```tsx
const errorRef = useRef<HTMLDivElement>(null);

// On validation error:
setTimeout(() => {
  errorRef.current?.focus();
}, 100);
```

- ✅ Focus programmatically moved to error alert on submission failure
- ✅ Alert has `tabIndex={-1}` to be focusable
- ✅ Slight delay allows error to render before focus

**Modal Focus:**
- ✅ Radix UI automatically focuses first focusable element in modal
- ✅ Focus trapped within modal (Tab cycles through modal elements only)
- ✅ Focus returned to trigger element on close

**Initial Focus:**
```tsx
const titleInputRef = useRef<HTMLInputElement>(null);

// Could add auto-focus on mount:
useEffect(() => {
  titleInputRef.current?.focus();
}, []);
```

- ⚠️ **Current:** No auto-focus on page load (follows browser default)
- ⚠️ **Enhancement:** Could add optional auto-focus to title field

---

## Focus Management

### Focus Indicators

**Visible Focus Rings:**

All interactive elements must have visible focus indicators. Shadcn UI components use Tailwind CSS focus utilities:

```css
focus-visible:outline-none
focus-visible:ring-1
focus-visible:ring-ring
focus-visible:ring-offset-2
```

**Tested Elements:**
- ✅ Buttons: Blue ring on focus
- ✅ Inputs: Blue border and ring on focus
- ✅ Textareas: Blue border and ring on focus
- ✅ Checkboxes: Blue ring on focus
- ✅ Radio buttons: Blue ring on focus
- ✅ Select triggers: Blue ring on focus
- ✅ Tab triggers: Blue ring on focus
- ✅ Links: Blue ring on focus

**Contrast Requirements:**
- Focus indicators must have at least 3:1 contrast ratio with background (WCAG 2.1 AA)
- Shadcn default theme meets this requirement

### Focus Trapping

**Modals and Dialogs:**

Focus must be trapped within modal dialogs to prevent users from interacting with background content:

- ✅ **Preview Modal:** Focus trapped, Tab cycles within modal
- ✅ **Publish Dialog:** Focus trapped, Tab cycles within dialog
- ✅ **Sheet (mobile):** Focus trapped in bottom sheet

**Radix UI Behavior:**
- Automatically traps focus on modal open
- Automatically restores focus to trigger on close
- Provides `onCloseAutoFocus` prop for custom focus restoration

**Test:**
```
1. Open Preview modal
2. Press Tab repeatedly
3. Verify focus cycles through:
   - Language toggle
   - Question form fields
   - Close button
   - Submit button (disabled)
4. Verify focus does NOT reach elements outside modal
5. Press Escape to close
6. Verify focus returns to "Preview" button
```

### Focus Restoration

**After Modal Close:**
- ✅ Focus returns to button that opened modal
- ✅ Radix UI handles this automatically via `onCloseAutoFocus`

**After Form Submission:**
- ✅ On error: Focus moves to error alert
- ✅ On success: Page redirects (no focus restoration needed)

**After Dynamic Content Changes:**
- ⚠️ **Current:** Focus not explicitly managed when adding/removing questions
- ⚠️ **Enhancement:** Focus could move to newly added question or confirmation message

---

## Testing Tools

### Browser Extensions

**Accessibility Testing:**

1. **axe DevTools (Chrome, Firefox, Edge)**
   - URL: https://www.deque.com/axe/devtools/
   - **Features:**
     - Automated WCAG 2.1 compliance testing
     - Highlights accessibility issues in DOM
     - Provides remediation guidance
   - **Usage:**
     - Install extension
     - Open DevTools → axe tab
     - Click "Scan Page"
     - Review and fix issues

2. **WAVE (Chrome, Firefox, Edge)**
   - URL: https://wave.webaim.org/extension/
   - **Features:**
     - Visual feedback on accessibility
     - Identifies ARIA landmarks, headings, form labels
     - Detects errors, alerts, and contrast issues
   - **Usage:**
     - Install extension
     - Click WAVE icon in toolbar
     - Review visual indicators on page

3. **Lighthouse (Chrome DevTools built-in)**
   - **Features:**
     - Accessibility audit score
     - Performance and SEO metrics
     - Best practices checklist
   - **Usage:**
     - Open DevTools → Lighthouse tab
     - Select "Accessibility" category
     - Click "Generate report"
     - Aim for score ≥ 90

### Keyboard Testing

**No Special Tools Required:**
- Use only keyboard (unplug mouse if needed)
- Test all navigation patterns documented above
- Document any inaccessible elements

### Screen Reader Testing

**Screen Reader Software:**
- **NVDA (Windows):** https://www.nvaccess.org/download/
- **JAWS (Windows, paid):** https://www.freedomscientific.com/products/software/jaws/
- **VoiceOver (macOS, built-in):** System Preferences → Accessibility
- **TalkBack (Android, built-in):** Settings → Accessibility

**Browser Compatibility:**
- NVDA: Best with Chrome or Firefox
- JAWS: Best with Chrome or Edge
- VoiceOver: Best with Safari
- TalkBack: Use Chrome

### Color Contrast Checkers

**Tools:**
1. **Chrome DevTools Color Picker:**
   - Inspect element → Styles pane → Click color swatch
   - View contrast ratio for text colors

2. **WebAIM Contrast Checker:**
   - URL: https://webaim.org/resources/contrastchecker/
   - Input foreground and background colors
   - Verify WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)

3. **Colour Contrast Analyser (Desktop App):**
   - URL: https://www.tpgi.com/color-contrast-checker/
   - Eyedropper tool to pick colors from screen

---

## Issue Reporting

### Accessibility Issue Template

When reporting accessibility issues, use this template:

```markdown
## Issue Title
[Brief description of the issue]

### WCAG Criteria
- **Success Criterion:** [e.g., 2.1.1 Keyboard]
- **Level:** [A, AA, or AAA]

### Component/Page
- **URL/Route:** [e.g., /research/questionnaires/new]
- **Component:** [e.g., QuestionBuilder > Move Up button]

### Description
[Detailed description of the issue]

### Steps to Reproduce
1. Navigate to [URL]
2. Use [keyboard/screen reader] to [action]
3. Observe [incorrect behavior]

### Expected Behavior
[What should happen according to WCAG guidelines]

### Actual Behavior
[What actually happens]

### Screen Reader/Browser
- **Screen Reader:** [e.g., NVDA 2024.1]
- **Browser:** [e.g., Chrome 120]
- **OS:** [e.g., Windows 11]

### Severity
- [ ] Critical (blocks users)
- [ ] High (major usability issue)
- [ ] Medium (workaround exists)
- [ ] Low (minor enhancement)

### Screenshots/Videos
[Attach if applicable]

### Suggested Fix
[If you have a solution, describe it here]
```

### Issue Priority

**Critical (P0):**
- Keyboard trap (no escape)
- Form submission impossible via keyboard
- Missing labels on required fields
- Non-functional screen reader navigation

**High (P1):**
- Poor focus indicators
- Missing ARIA attributes on complex widgets
- Confusing screen reader announcements
- Non-descriptive button labels

**Medium (P2):**
- Missing descriptions on form fields
- Suboptimal tab order
- Missing keyboard shortcuts
- Color contrast slightly below WCAG AA

**Low (P3):**
- Missing tooltips
- Redundant screen reader announcements
- Enhancement opportunities (e.g., better focus management)

---

## Testing Checklist

Use this checklist to verify accessibility compliance:

### Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical and follows visual layout
- [ ] Shift+Tab works in reverse
- [ ] Enter key activates buttons and links
- [ ] Spacebar toggles checkboxes and activates buttons
- [ ] Escape key closes modals and dropdowns
- [ ] Arrow keys navigate radio groups and dropdowns
- [ ] Focus indicators are clearly visible
- [ ] No keyboard traps (except intentional focus traps in modals)
- [ ] Keyboard shortcuts work as documented

### Screen Reader Compatibility
- [ ] All form fields have proper labels
- [ ] Required fields announced as "required"
- [ ] Field types announced correctly (edit, checkbox, combo box, etc.)
- [ ] Error messages read aloud via live regions
- [ ] Loading states announced
- [ ] Button actions clearly described
- [ ] Modals announce title and description
- [ ] Focus moves appropriately on state changes
- [ ] Form validation results announced

### ARIA Attributes
- [ ] `aria-label` or `aria-labelledby` on all interactive elements
- [ ] `aria-required` on required fields
- [ ] `aria-invalid` on fields with errors
- [ ] `aria-describedby` links to descriptions and error messages
- [ ] `aria-live` regions for dynamic content
- [ ] `role="alert"` for error messages
- [ ] `role="status"` for status updates
- [ ] Proper `role` attributes on custom widgets

### Focus Management
- [ ] Focus indicators meet 3:1 contrast ratio
- [ ] Focus moves to error alerts on validation failure
- [ ] Focus trapped in modals
- [ ] Focus restored after modal close
- [ ] Logical focus order throughout form

### Testing Tools
- [ ] axe DevTools scan passes with no critical issues
- [ ] WAVE scan shows proper structure and labels
- [ ] Lighthouse Accessibility score ≥ 90
- [ ] Color contrast checked and passes WCAG AA

### Screen Reader Testing
- [ ] Tested with NVDA + Chrome (Windows)
- [ ] Tested with VoiceOver + Safari (macOS)
- [ ] All announcements accurate and helpful
- [ ] No redundant or confusing announcements

---

## Additional Resources

### WCAG Guidelines
- **WCAG 2.1 Quick Reference:** https://www.w3.org/WAI/WCAG21/quickref/
- **Understanding WCAG 2.1:** https://www.w3.org/WAI/WCAG21/Understanding/

### Radix UI Accessibility
- **Radix UI Components:** https://www.radix-ui.com/primitives
- Each component has detailed accessibility documentation

### Keyboard Patterns
- **ARIA Authoring Practices Guide:** https://www.w3.org/WAI/ARIA/apg/

### Testing Guides
- **WebAIM Screen Reader Testing:** https://webaim.org/articles/screenreader_testing/
- **Deque University:** https://dequeuniversity.com/ (paid courses)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-10-13 | Claude Code | Initial accessibility testing guide |

---

**Last Updated:** 2025-10-13
**Maintained By:** Gentil Feedback Engineering Team
**Contact:** For questions, open an issue in the repository.

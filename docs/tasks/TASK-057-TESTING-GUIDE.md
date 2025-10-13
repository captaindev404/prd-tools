# Task 57: Progress Indicator - Testing Guide

**Purpose**: Manual testing checklist for the questionnaire creation form progress indicator feature.

---

## Test Environment Setup

1. **Start Development Server**:
   ```bash
   cd /Users/captaindev404/Code/club-med/gentil-feedback
   npm run dev
   ```

2. **Navigate to Form**:
   - URL: http://localhost:3000/research/questionnaires/new
   - Must be authenticated as RESEARCHER, PM, or ADMIN role

3. **Browser Testing**:
   - Chrome (latest)
   - Firefox (latest)
   - Safari (latest)
   - Edge (latest)

---

## Visual Inspection Checklist

### Progress Indicator Card

**Location**: Top of form, below any error alerts, above tab navigation

**Visual Elements to Verify**:
- [ ] Card has left border accent (4px solid primary color)
- [ ] Header row shows "Form Completion" (muted) and "X/4 sections completed (Y%)" (bold)
- [ ] Progress bar is visible and proportional
- [ ] Progress bar height is ~10px
- [ ] Section checklist grid displays correctly
- [ ] Mobile: 2 columns, Desktop: 4 columns

**Color Scheme**:
- [ ] Complete sections: Green checkmark + green text
- [ ] Incomplete sections: Empty circle + muted text
- [ ] Progress bar: Primary color fill on muted background

---

## Functional Testing

### Test 1: Empty Form State

**Steps**:
1. Load form fresh (clear browser cache if needed)
2. Observe initial progress state

**Expected Results**:
- [ ] Progress shows "0/4 sections completed (0%)" OR "1/4 sections completed (25%)"
- [ ] Progress bar shows 0% or 25% fill
- [ ] All sections have empty circles (or Settings has checkmark)
- [ ] All tab badges show alert circles (or Settings shows checkmark)

**Why 25% might show**: Response Settings tab is always valid because it has defaults.

---

### Test 2: Title Entry (General Info Completion)

**Steps**:
1. Start with empty form
2. Click "General Info" tab
3. Enter title: "Test Questionnaire"
4. Observe progress updates

**Expected Results**:
- [ ] General Info section gets green checkmark
- [ ] General Info tab badge changes to green checkmark
- [ ] Progress updates to next increment (1/4 or 2/4)
- [ ] Progress bar animates smoothly
- [ ] Change happens immediately (real-time)

**Edge Cases**:
- [ ] Enter title with <3 characters → checkmark disappears
- [ ] Enter title with >200 characters → checkmark disappears
- [ ] Enter only spaces → checkmark does not appear
- [ ] Delete title → checkmark disappears

---

### Test 3: Question Addition (Questions Completion)

**Steps**:
1. Complete General Info (title entered)
2. Click "Questions" tab
3. Click "Add Question" button
4. Select question type (e.g., "Text")
5. Enter question text: "What is your feedback?"
6. Observe progress updates

**Expected Results**:
- [ ] Questions section gets green checkmark
- [ ] Questions tab badge changes to green checkmark
- [ ] Progress updates to next increment (2/4 or 3/4)
- [ ] Progress bar fills accordingly
- [ ] Change happens immediately after text entry

**Edge Cases**:
- [ ] Add question but leave text empty → no checkmark
- [ ] Add question with only spaces → no checkmark
- [ ] Add second question → checkmark remains
- [ ] Delete all questions → checkmark disappears

---

### Test 4: Targeting Configuration (Targeting Completion)

**Steps**:
1. Complete General Info and Questions
2. Click "Targeting & Settings" tab
3. Targeting Type defaults to "All Users" (should be valid)
4. Change to "Specific Panels"
5. Select at least one panel (if available)
6. Observe progress updates

**Expected Results**:
- [ ] Targeting section has checkmark when "All Users" selected
- [ ] Targeting remains complete after selecting "Specific Panels" + panel
- [ ] Targeting loses checkmark if "Specific Panels" selected but no panels chosen
- [ ] Progress updates accordingly
- [ ] Tab badge updates

**Edge Cases**:
- [ ] "All Users" → always valid (checkmark)
- [ ] "Specific Panels" + no selection → no checkmark
- [ ] "Specific Panels" + 1+ panels → checkmark appears

---

### Test 5: Complete Form (100% Progress)

**Steps**:
1. Complete all sections:
   - Title: Valid (3-200 chars)
   - Questions: At least 1 with text
   - Targeting: Valid configuration
   - Settings: Always valid
2. Observe final progress state

**Expected Results**:
- [ ] Progress shows "4/4 sections completed (100%)"
- [ ] Progress bar is completely filled
- [ ] All four sections have green checkmarks
- [ ] All three tab badges show green checkmarks
- [ ] Visual satisfaction of completion

---

### Test 6: Progress Regression

**Steps**:
1. Achieve 100% completion
2. Go back and delete title
3. Observe progress updates

**Expected Results**:
- [ ] Progress regresses to "3/4 sections completed (75%)"
- [ ] Progress bar visually shrinks
- [ ] General Info checkmark disappears
- [ ] General Info tab badge changes to alert circle
- [ ] Other sections remain complete

**Validation**:
- [ ] Progress accurately reflects current state
- [ ] No stale/cached completion status

---

## Responsive Design Testing

### Mobile View (< 768px)

**Test Device**: iPhone, Android, or resize browser to <768px

**Expected Results**:
- [ ] Progress card remains visible
- [ ] Section checklist displays in 2 columns
- [ ] Text remains readable
- [ ] Progress bar full width
- [ ] Tab badges visible (may stack on very small screens)
- [ ] Icons maintain size and clarity

**Layout**:
```
┌─────────────────────────────┐
│ Form Completion    0/4 (0%) │
│ ░░░░░░░░░░░░░░░░░░░░░░░░    │
│ ○ General Info  ○ Questions │
│ ○ Targeting     ○ Settings  │
└─────────────────────────────┘
```

---

### Tablet View (768px - 1024px)

**Test Device**: iPad or resize browser to 768-1024px

**Expected Results**:
- [ ] Section checklist displays in 4 columns
- [ ] All content on single row
- [ ] Optimal spacing between elements
- [ ] Tab badges clearly visible

---

### Desktop View (> 1024px)

**Test Device**: Standard desktop browser

**Expected Results**:
- [ ] Section checklist displays in 4 columns
- [ ] Maximum clarity and readability
- [ ] Progress bar proportional
- [ ] All text on single lines

---

## Accessibility Testing

### Screen Reader Testing

**Tools**: VoiceOver (Mac), NVDA (Windows), JAWS (Windows)

**Test Steps**:
1. Navigate to form with screen reader active
2. Tab through progress indicator elements
3. Listen to announcements

**Expected Announcements**:
- [ ] Progress bar: "Form X percent complete"
- [ ] Complete sections: "Complete" status announced
- [ ] Incomplete sections: "Incomplete" status announced
- [ ] Tab badges: Status announced when focused
- [ ] Section names read correctly

---

### Keyboard Navigation

**Test Steps**:
1. Navigate form using only keyboard (no mouse)
2. Use Tab key to move between elements
3. Use arrow keys within TabsList

**Expected Results**:
- [ ] Can reach all interactive elements
- [ ] Focus indicators clearly visible
- [ ] Tab navigation logical and predictable
- [ ] No keyboard traps
- [ ] Arrow keys switch tabs correctly

---

### Color Contrast

**Tools**: Browser DevTools, WAVE, axe DevTools

**Test Steps**:
1. Check color contrast ratios
2. Verify against WCAG 2.1 AA standards

**Expected Results**:
- [ ] Green checkmark: ≥4.5:1 contrast ratio
- [ ] Muted text: ≥4.5:1 contrast ratio
- [ ] Progress bar fill: ≥3:1 contrast ratio (non-text)
- [ ] All text meets contrast requirements

---

### Non-Color Status Indication

**Test Steps**:
1. Use browser extension to simulate color blindness
2. Or use grayscale filter

**Expected Results**:
- [ ] Status distinguishable without color
- [ ] Icon shapes differ (checkmark vs. circle)
- [ ] Text weight/style provides additional cues
- [ ] Status still understandable in grayscale

---

## Performance Testing

### Load Time

**Test Steps**:
1. Clear browser cache
2. Load form and measure time to interactive
3. Check DevTools Performance tab

**Expected Results**:
- [ ] Progress indicator renders immediately
- [ ] No layout shift or flicker
- [ ] Form remains responsive during updates
- [ ] No lag when typing or clicking

---

### State Update Performance

**Test Steps**:
1. Type rapidly in title field
2. Add/remove questions quickly
3. Toggle targeting options repeatedly
4. Monitor browser DevTools Performance

**Expected Results**:
- [ ] Updates are instant (<16ms per frame)
- [ ] No stuttering or freezing
- [ ] Progress bar animates smoothly
- [ ] No performance warnings in console

---

## Edge Case Testing

### Boundary Values

**Test Cases**:
1. **Title exactly 3 characters**: "abc"
   - [ ] Should show as complete

2. **Title exactly 200 characters**: (fill with 200 chars)
   - [ ] Should show as complete

3. **Title 2 characters**: "ab"
   - [ ] Should show as incomplete

4. **Title 201 characters**: (fill with 201 chars)
   - [ ] Should show as incomplete

---

### Multiple Tab Switches

**Test Steps**:
1. Switch between tabs rapidly
2. Make changes in different tabs
3. Return to previous tabs

**Expected Results**:
- [ ] Progress state persists across tab switches
- [ ] No state loss
- [ ] Progress always accurate
- [ ] No visual glitches

---

### Date Range Validation

**Test Steps**:
1. Complete General Info, Questions, Targeting
2. Go to Response Settings
3. Set start date: Tomorrow
4. Set end date: Today (before start)
5. Observe Settings completion status

**Expected Results**:
- [ ] Settings shows incomplete (no checkmark)
- [ ] Progress regresses if it was 100%
- [ ] Fix dates (end > start) → Settings complete again

---

## Browser-Specific Testing

### Chrome
- [ ] Progress bar renders correctly
- [ ] Animations smooth (60fps)
- [ ] DevTools shows no console errors
- [ ] Lighthouse accessibility score: 90+

### Firefox
- [ ] Progress bar renders correctly
- [ ] Colors match Chrome
- [ ] No visual inconsistencies

### Safari
- [ ] Progress bar renders correctly
- [ ] Animations perform well
- [ ] No webkit-specific issues

### Edge
- [ ] Progress bar renders correctly
- [ ] Behavior matches Chrome
- [ ] No edge cases (pun intended)

---

## Error Scenario Testing

### Network Failure Simulation

**Test Steps**:
1. Open DevTools → Network tab
2. Throttle to "Offline"
3. Try to save form
4. Observe progress state

**Expected Results**:
- [ ] Progress indicator remains visible
- [ ] State not lost during error
- [ ] Can continue editing after network restored

---

### Concurrent Editing

**Test Steps**:
1. Open form in two browser tabs
2. Make changes in tab 1
3. Make different changes in tab 2
4. Observe progress in each tab

**Expected Results**:
- [ ] Each tab maintains independent progress state
- [ ] No state synchronization issues
- [ ] Progress accurate to each tab's form state

---

## User Acceptance Testing

### Subjective Quality Checks

**Criteria**:
- [ ] Progress indicator looks professional and polished
- [ ] Colors are pleasant and not overwhelming
- [ ] Progress bar feels satisfying to complete
- [ ] Checkmarks provide positive reinforcement
- [ ] Layout is intuitive and clear
- [ ] Text is readable at all screen sizes
- [ ] Icons are recognizable and appropriate
- [ ] Overall UX feels cohesive with rest of app

---

### User Feedback Questions

Ask 3-5 users to complete the form and answer:

1. **Clarity**: "Did you understand what the progress indicator showed?" (1-5 scale)
2. **Usefulness**: "Did the progress indicator help you complete the form?" (1-5 scale)
3. **Motivation**: "Did seeing progress encourage you to finish?" (1-5 scale)
4. **Improvement**: "What would make the progress indicator better?" (open-ended)

**Target Scores**: Average ≥4.0/5.0 for questions 1-3

---

## Regression Testing

### Existing Functionality

**Verify these still work**:
- [ ] Form validation (title, questions, targeting)
- [ ] "Save as Draft" button
- [ ] "Save & Publish" button
- [ ] Preview modal
- [ ] Audience size calculation
- [ ] Tab navigation
- [ ] Error alerts
- [ ] Success toasts
- [ ] Redirect after save/publish

**No Regressions**: Existing features unaffected by progress indicator

---

## Bug Tracking Template

**If issues found**, document using this format:

```markdown
### Bug: [Short Description]

**Severity**: Critical / High / Medium / Low
**Browser**: Chrome 120 / Firefox 120 / Safari 17 / Edge 120
**Device**: Desktop / Mobile / Tablet

**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Result**:
What should happen

**Actual Result**:
What actually happened

**Screenshots**:
[Attach screenshots if relevant]

**Console Errors**:
[Paste any console errors]
```

---

## Sign-Off Checklist

Before marking task as production-ready:

- [ ] All functional tests passing
- [ ] Responsive design verified on 3+ screen sizes
- [ ] Accessibility tests passing (screen reader, keyboard, contrast)
- [ ] Performance acceptable (<16ms per frame)
- [ ] Edge cases handled gracefully
- [ ] Browser compatibility verified (Chrome, Firefox, Safari, Edge)
- [ ] No regressions in existing functionality
- [ ] User acceptance criteria met (if applicable)
- [ ] Documentation complete
- [ ] No critical or high-severity bugs

---

## Testing Completion Report

**Date Tested**: ___________
**Tester Name**: ___________
**Browser(s)**: ___________
**Device(s)**: ___________

**Results**:
- Total test cases: 50+
- Passed: _____
- Failed: _____
- Blocked: _____

**Overall Status**: ✅ PASS / ❌ FAIL / ⏸️ BLOCKED

**Notes**:
_____________________
_____________________
_____________________

**Sign-Off**:
Approved for production deployment: ☐ YES ☐ NO

---

## Next Steps After Testing

1. **If all tests pass**:
   - Mark task as complete in PRD tool
   - Create pull request for code review
   - Deploy to staging environment
   - Schedule production deployment

2. **If issues found**:
   - Create bug tickets with priority
   - Fix critical/high issues
   - Re-test affected areas
   - Obtain sign-off

3. **Documentation**:
   - Update user guide if needed
   - Add screenshots to documentation
   - Create demo video (optional)
   - Announce feature to team

---

**Testing Guide Version**: 1.0
**Last Updated**: 2025-10-13
**Task**: #57 Progress Indicator Implementation

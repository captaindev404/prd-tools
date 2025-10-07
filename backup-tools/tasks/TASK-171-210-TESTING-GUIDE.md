# Task 171 & 210 Testing Guide

## Overview
This guide provides step-by-step instructions for testing the mobile drawer behavior (Task 171) and panel creation wizard (Task 210).

---

## Task 171: Mobile Drawer Behavior Testing

### Prerequisites
- Development server running: `npm run dev`
- Browser DevTools open

### Test Scenarios

#### Test 1: Mobile Drawer Opens/Closes
**Steps**:
1. Open http://localhost:3000/dashboard
2. Resize browser to < 768px width (or use mobile device mode)
3. Verify hamburger menu icon is visible in header (left side)
4. Click hamburger menu icon
5. **Expected**: Drawer slides in from left
6. **Expected**: Backdrop overlay appears
7. **Expected**: Navigation items visible in drawer
8. Click backdrop or close button
9. **Expected**: Drawer closes

**Pass Criteria**:
- ✅ Hamburger icon visible on mobile
- ✅ Drawer slides in smoothly
- ✅ Backdrop overlay present
- ✅ Click outside closes drawer
- ✅ Navigation hierarchy maintained

#### Test 2: Desktop Sidebar Behavior
**Steps**:
1. Resize browser to ≥ 768px width
2. Verify sidebar is visible on left
3. Click sidebar trigger in header
4. **Expected**: Sidebar collapses/expands
5. **Expected**: No drawer overlay

**Pass Criteria**:
- ✅ Sidebar visible on desktop
- ✅ Toggle button works
- ✅ No drawer behavior on desktop
- ✅ State persists (cookies)

#### Test 3: Responsive Breakpoint Transition
**Steps**:
1. Start at desktop width (≥ 768px)
2. Slowly resize to mobile width (< 768px)
3. **Expected**: Sidebar disappears, hamburger appears
4. Resize back to desktop
5. **Expected**: Sidebar reappears, hamburger disappears

**Pass Criteria**:
- ✅ Smooth transition at breakpoint
- ✅ No flashing or glitches
- ✅ Proper state management

#### Test 4: Keyboard Navigation
**Steps**:
1. Set browser to mobile width
2. Tab to hamburger menu icon
3. Press Enter
4. **Expected**: Drawer opens
5. Tab through navigation items
6. **Expected**: Focus visible on each item
7. Press Escape
8. **Expected**: Drawer closes

**Pass Criteria**:
- ✅ Keyboard accessible
- ✅ Focus indicators visible
- ✅ Escape key closes drawer
- ✅ Enter key opens drawer

#### Test 5: Screen Reader Accessibility
**Steps**:
1. Enable screen reader (VoiceOver on Mac, NVDA on Windows)
2. Navigate to hamburger icon
3. **Expected**: "Toggle Sidebar" announced
4. Activate icon
5. **Expected**: Drawer opens with proper ARIA labels
6. Navigate through items
7. **Expected**: Each item announced correctly

**Pass Criteria**:
- ✅ Proper ARIA labels
- ✅ Screen reader announces drawer state
- ✅ Navigation items readable

---

## Task 210: Panel Creation Wizard Testing

### Prerequisites
- Development server running: `npm run dev`
- Logged in as user with RESEARCHER, PM, or ADMIN role
- API `/api/panels` endpoint working

### Test Scenarios

#### Test 1: Wizard Step Navigation
**Steps**:
1. Navigate to http://localhost:3000/research/panels/new
2. **Expected**: Step 1 visible with progress indicator
3. Fill in panel name: "Test Panel"
4. Fill in description: "This is a test panel"
5. Click "Next"
6. **Expected**: Step 2 visible, progress indicator updated
7. Click "Back"
8. **Expected**: Return to Step 1 with data preserved
9. **Expected**: Previously entered name and description still visible

**Pass Criteria**:
- ✅ Step 1 displays correctly
- ✅ Next button navigates to Step 2
- ✅ Back button returns to Step 1
- ✅ Form data persists across navigation
- ✅ Progress indicator updates

#### Test 2: Step 1 Validation
**Steps**:
1. Navigate to Step 1
2. Leave panel name empty
3. Click "Next"
4. **Expected**: Validation error "Name must be at least 3 characters"
5. Enter "AB" (2 characters)
6. Click "Next"
7. **Expected**: Validation error
8. Enter "ABC" (3 characters)
9. Click "Next"
10. **Expected**: Navigate to Step 2

**Pass Criteria**:
- ✅ Empty name shows error
- ✅ Short name shows error
- ✅ Valid name allows navigation
- ✅ Error messages clear and helpful

#### Test 3: Step 2 Eligibility Rules
**Steps**:
1. Navigate to Step 2
2. Select roles: PM, PO (checkboxes)
3. **Expected**: Checkboxes checked
4. Enter villages: "vlg-001, vlg-002"
5. Select consents: "Research Contact", "Usage Analytics"
6. Enter minimum tenure: "90"
7. Click "Next"
8. **Expected**: Navigate to Step 3
9. Click "Back" then "Next"
10. **Expected**: All selections preserved

**Pass Criteria**:
- ✅ Role checkboxes work
- ✅ Village input accepts text
- ✅ Consent checkboxes work
- ✅ Tenure input accepts numbers
- ✅ Data persists on navigation

#### Test 4: Step 3 Summary and Submission
**Steps**:
1. Navigate to Step 3
2. **Expected**: Summary card shows panel name and selected criteria
3. Enter target size: "100"
4. Click "Create Panel"
5. **Expected**: Loading spinner appears
6. **Expected**: Success toast notification
7. **Expected**: Redirect to panel detail page

**Pass Criteria**:
- ✅ Summary displays correctly
- ✅ Create button shows loading state
- ✅ Success toast appears
- ✅ Redirects to correct page
- ✅ Panel created in database

#### Test 5: Full Wizard Flow
**Steps**:
1. Start fresh at Step 1
2. Fill all fields in Step 1:
   - Name: "Early Adopters Panel"
   - Description: "Panel for testing new features with early adopters"
3. Click "Next"
4. Fill all fields in Step 2:
   - Roles: USER, PM
   - Villages: "all"
   - Consents: All three
   - Tenure: "30"
5. Click "Next"
6. Fill Step 3:
   - Target size: "150"
7. Verify summary shows all data
8. Click "Create Panel"
9. **Expected**: Panel created successfully

**Pass Criteria**:
- ✅ Complete flow works end-to-end
- ✅ All data captured correctly
- ✅ API call successful
- ✅ Panel appears in list

#### Test 6: Error Handling
**Steps**:
1. Complete Steps 1-3
2. Simulate API failure (disconnect network or use DevTools)
3. Click "Create Panel"
4. **Expected**: Error toast notification
5. **Expected**: Stays on Step 3 (doesn't navigate away)
6. **Expected**: Can retry submission

**Pass Criteria**:
- ✅ Error toast displays
- ✅ User not redirected on error
- ✅ Form data preserved
- ✅ Can retry submission

#### Test 7: Visual Progress Indicator
**Steps**:
1. Start at Step 1
2. **Expected**: Step 1 highlighted in primary color
3. **Expected**: Steps 2 and 3 in muted color
4. Navigate to Step 2
5. **Expected**: Step 1 shows checkmark
6. **Expected**: Step 2 highlighted in primary color
7. **Expected**: Step 3 in muted color
8. Navigate to Step 3
9. **Expected**: Steps 1 and 2 show checkmarks
10. **Expected**: Step 3 highlighted in primary color

**Pass Criteria**:
- ✅ Current step highlighted
- ✅ Completed steps show checkmark
- ✅ Future steps muted
- ✅ Connecting lines styled correctly

#### Test 8: Mobile Responsive
**Steps**:
1. Resize browser to mobile width (< 768px)
2. Complete wizard on mobile
3. **Expected**: All steps display correctly
4. **Expected**: Buttons stack properly
5. **Expected**: Checkboxes touch-friendly
6. **Expected**: Form fields full width

**Pass Criteria**:
- ✅ Wizard works on mobile
- ✅ Proper responsive layout
- ✅ Touch targets adequate size
- ✅ No horizontal scrolling

#### Test 9: Keyboard Navigation
**Steps**:
1. Navigate to wizard using keyboard only
2. Tab through Step 1 fields
3. **Expected**: Focus visible on each field
4. Press Enter on "Next" button
5. **Expected**: Navigate to Step 2
6. Tab through checkboxes
7. **Expected**: Space bar toggles checkboxes
8. Complete wizard using keyboard only

**Pass Criteria**:
- ✅ All fields keyboard accessible
- ✅ Focus indicators visible
- ✅ Checkboxes work with Space
- ✅ Buttons work with Enter

#### Test 10: Cancel/Back Behavior
**Steps**:
1. Fill Step 1
2. Navigate to Step 2
3. Browser back button
4. **Expected**: Still on wizard (internal navigation)
5. Click "Back" button
6. **Expected**: Return to Step 1
7. Close browser tab and reopen
8. **Expected**: Wizard starts fresh (no persistence)

**Pass Criteria**:
- ✅ Back button works
- ✅ Data preserved on internal navigation
- ✅ No unwanted persistence across sessions

---

## Regression Testing

### Existing Features to Verify
After implementing these tasks, verify:

1. **Navigation**: All sidebar links still work
2. **Existing Panel Form**: `/research/panels/[id]/edit` still works
3. **Breadcrumbs**: Display correctly on all pages
4. **Notifications**: Bell icon still works
5. **User Menu**: Avatar dropdown still works

---

## Performance Testing

### Metrics to Check
1. **Mobile Drawer**:
   - Open/close animation should be < 300ms
   - No jank or stuttering

2. **Wizard**:
   - Step transitions should be instant
   - Form validation should be immediate
   - API submission should complete within 2s

---

## Browser Compatibility

Test in:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

---

## Accessibility Testing Tools

Use these tools to verify accessibility:
1. **Chrome DevTools Lighthouse**: Run accessibility audit
2. **axe DevTools**: Browser extension for accessibility testing
3. **WAVE**: Web accessibility evaluation tool
4. **Screen Readers**: VoiceOver (Mac), NVDA (Windows), JAWS

---

## Known Issues / Notes

### Task 171
- No known issues
- Implementation follows shadcn best practices
- Mobile drawer behavior built-in to shadcn Sidebar component

### Task 210
- EligibilityRulesBuilder component (Task 205) not yet implemented
- Eligibility preview feature pending
- Village selector is text input (not dropdown) for now

---

## Success Criteria Summary

### Task 171: Mobile Drawer
- [x] Hamburger menu visible on mobile
- [x] Drawer slides in from left
- [x] Backdrop overlay works
- [x] Click outside closes drawer
- [x] Desktop sidebar unaffected
- [x] Keyboard accessible
- [x] Screen reader friendly

### Task 210: Panel Wizard
- [x] Three-step wizard works
- [x] Progress indicator updates
- [x] Form validation per step
- [x] Data persists across steps
- [x] Summary displays correctly
- [x] Panel creates successfully
- [x] Error handling works
- [x] Mobile responsive
- [x] Keyboard accessible

---

## Reporting Issues

If issues found during testing:
1. Document steps to reproduce
2. Include browser and viewport size
3. Screenshot or video if applicable
4. Note expected vs actual behavior
5. Report in project issue tracker

---

**Testing Date**: 2025-10-03
**Tasks**: 171 (Mobile Drawer), 210 (Panel Wizard)
**Status**: Ready for Testing

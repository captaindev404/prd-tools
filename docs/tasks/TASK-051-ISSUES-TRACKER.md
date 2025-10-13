# Task 051 - Mobile Issues Tracker

**Last Updated**: 2025-10-13 | **Total Issues**: 8

---

## Issue Priority Matrix

```
HIGH PRIORITY (Fix Before Production)
┌─────────────────────────────────────────────────┐
│ ISSUE-051-07: Action Buttons Overflow          │ ← CRITICAL
│ ISSUE-051-01: Tab Text Too Long                │ ← HIGH
└─────────────────────────────────────────────────┘

MEDIUM PRIORITY (Should Fix)
┌─────────────────────────────────────────────────┐
│ ISSUE-051-03: Question Header Text Too Long    │
│ ISSUE-051-05: datetime-local Input Issues      │
│ ISSUE-051-02: Tab Height < 44px                │
└─────────────────────────────────────────────────┘

LOW PRIORITY (Nice to Have)
┌─────────────────────────────────────────────────┐
│ ISSUE-051-04: Button Gap Too Small             │
│ ISSUE-051-06: Anonymous Checkbox Too Small     │
└─────────────────────────────────────────────────┘
```

---

## CRITICAL - ISSUE-051-07

### Action Buttons Overflow on Small Phones

**Status**: 🔴 Open | **Priority**: Critical | **Severity**: High

**Component**: Action buttons footer
**File**: `/src/components/questionnaires/questionnaire-create-form.tsx`
**Lines**: 647-713

#### Problem Description

On screens narrower than 400px (Galaxy S21 at 360px), the four action buttons don't fit horizontally:

```
┌─────────────────────────────────┐
│ [Cancel] [Preview]              │
│              [Save] [Publish] ← OVERFLOWS!
└─────────────────────────────────┘
360px width
```

**Calculation**:
- Available width: 360px - padding = ~328px
- Required width: 140px + 160px + Cancel + Preview = ~450px
- **Overflow**: 122px

#### Impact

- **User Experience**: Users cannot tap "Save & Publish" button
- **Devices Affected**: Galaxy S21 (360px), iPhone SE (375px)
- **Severity**: Blocks primary user action on mobile

#### Current Code

```tsx
<div className="flex items-center justify-between border-t pt-6">
  <div className="flex gap-2">
    <Button variant="outline">Cancel</Button>
    <Button variant="outline">Preview</Button>
  </div>
  <div className="flex gap-2">
    <Button className="min-w-[140px]">Save as Draft</Button>
    <Button className="min-w-[160px]">Save & Publish</Button>
  </div>
</div>
```

#### Recommended Fix

**Option 1: Stack Vertically on Mobile** (Preferred)

```tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t pt-6">
  <div className="flex gap-2 justify-center sm:justify-start">
    <Button variant="outline" className="flex-1 sm:flex-initial min-h-[44px]">
      Cancel
    </Button>
    <Button variant="outline" className="flex-1 sm:flex-initial min-h-[44px]">
      <Eye className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">Preview</span>
    </Button>
  </div>
  <div className="flex gap-2 justify-center sm:justify-end">
    <Button variant="outline" className="flex-1 sm:flex-initial min-h-[44px]">
      <Save className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">Save as </span>Draft
    </Button>
    <Button className="flex-1 sm:flex-initial min-h-[44px]">
      <Send className="h-4 w-4 sm:mr-2" />
      Publish
    </Button>
  </div>
</div>
```

**Result**:
```
Mobile (< 640px):
┌─────────────────────────────────┐
│      [Cancel] [Preview]         │
│      [Draft]  [Publish]         │ ← Stacked, all visible
└─────────────────────────────────┘

Tablet+ (≥ 640px):
┌─────────────────────────────────────────────────┐
│ [Cancel] [Preview]        [Draft] [Publish]     │ ← Horizontal
└─────────────────────────────────────────────────┘
```

**Option 2: Shorter Text** (Alternative)

```tsx
<Button className="min-h-[44px] text-xs sm:text-sm px-2 sm:px-4">
  <Save className="h-4 w-4" />
  <span className="ml-1">Draft</span>
</Button>
```

#### Testing Checklist

- [ ] Test at 360px (Galaxy S21)
- [ ] Test at 375px (iPhone SE)
- [ ] Test at 390px (iPhone 14)
- [ ] Verify all buttons are 44x44px minimum
- [ ] Verify tap targets don't overlap
- [ ] Test in portrait and landscape
- [ ] Verify loading states still work

#### Estimated Time

- Implementation: 1 hour
- Testing: 30 minutes
- **Total**: 1.5 hours

#### Dependencies

None

#### Related Issues

- ISSUE-051-04: Button gaps in question cards

---

## HIGH - ISSUE-051-01

### Tab Text Wraps on Narrow Screens

**Status**: 🟡 Open | **Priority**: High | **Severity**: Medium

**Component**: Tab navigation
**File**: `/src/components/questionnaires/questionnaire-create-form.tsx`
**Lines**: 412-417

#### Problem Description

"Targeting & Settings" text is too long for 360px width tabs:

```
┌───────────┬───────────┬───────────┐
│  General  │ Questions │ Targeting │
│    Info   │           │    &      │ ← Wraps
│           │           │ Settings  │ ← Looks broken
└───────────┴───────────┴───────────┘
```

#### Impact

- **User Experience**: Tab appears broken, harder to read
- **Devices Affected**: Galaxy S21 (360px)
- **Severity**: Visual/UX issue, functionality still works

#### Current Code

```tsx
<TabsList className="grid w-full grid-cols-3">
  <TabsTrigger value="general">General Info</TabsTrigger>
  <TabsTrigger value="questions">Questions</TabsTrigger>
  <TabsTrigger value="targeting">Targeting & Settings</TabsTrigger>
</TabsList>
```

#### Recommended Fix

```tsx
<TabsList className="grid w-full grid-cols-3 h-auto min-h-[44px]">
  <TabsTrigger value="general" className="text-xs sm:text-sm px-2 py-3">
    General Info
  </TabsTrigger>
  <TabsTrigger value="questions" className="text-xs sm:text-sm px-2 py-3">
    Questions
  </TabsTrigger>
  <TabsTrigger value="targeting" className="text-xs sm:text-sm px-2 py-3 whitespace-normal leading-tight">
    Targeting
    <span className="hidden sm:inline"> & Settings</span>
  </TabsTrigger>
</TabsList>
```

**Result**:
```
Mobile:
┌───────────┬───────────┬───────────┐
│  General  │ Questions │ Targeting │ ← Shorter text
│    Info   │           │           │
└───────────┴───────────┴───────────┘

Tablet+:
┌───────────┬───────────┬─────────────────┐
│  General  │ Questions │ Targeting &     │ ← Full text
│    Info   │           │    Settings     │
└───────────┴───────────┴─────────────────┘
```

#### Testing Checklist

- [ ] Test at 360px (Galaxy)
- [ ] Test at 375px (iPhone SE)
- [ ] Verify tab height ≥ 44px
- [ ] Verify text is readable
- [ ] Verify active state is clear
- [ ] Test tab switching still works

#### Estimated Time

- Implementation: 30 minutes
- Testing: 15 minutes
- **Total**: 45 minutes

#### Dependencies

None

---

## MEDIUM - ISSUE-051-03

### Question Header Text Too Long

**Status**: 🟡 Open | **Priority**: Medium | **Severity**: Medium

**Component**: Question cards
**File**: `/src/components/questionnaires/question-builder.tsx`
**Lines**: 143-146

#### Problem Description

"Question 1 - MCQ_MULTIPLE" is too long for small screens, causes awkward wrapping.

#### Recommended Fix

```tsx
<CardTitle className="text-sm md:text-base break-words">
  Q{index + 1} · {formatQuestionType(question.type)}
</CardTitle>

const formatQuestionType = (type: string): string => {
  const typeMap = {
    'mcq_multiple': 'MCQ Multiple',
    'mcq_single': 'MCQ Single',
    'likert': 'Likert',
    'nps': 'NPS',
    'text': 'Text',
    'number': 'Number',
    'rating': 'Rating'
  };
  return typeMap[type] || type;
};
```

**Result**: "Q1 · MCQ Multiple" (shorter, cleaner)

#### Estimated Time

1 hour

---

## MEDIUM - ISSUE-051-05

### datetime-local Input May Not Work on Mobile

**Status**: 🟡 Open | **Priority**: Medium | **Severity**: Medium

**Component**: Start/End date inputs
**File**: `/src/components/questionnaires/questionnaire-create-form.tsx`
**Lines**: 603-625

#### Problem Description

`<Input type="datetime-local">` has inconsistent support across mobile browsers.

#### Recommended Fix

Migrate to Calendar component (like `ResponseSettingsTab.tsx`):

```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" className="w-full justify-start">
      <CalendarIcon className="mr-2 h-4 w-4" />
      {startAt ? format(new Date(startAt), 'PPP') : 'Start immediately'}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0">
    <Calendar mode="single" selected={startAt} onSelect={setStartAt} />
  </PopoverContent>
</Popover>
```

#### Estimated Time

3-4 hours

---

## MEDIUM - ISSUE-051-02

### Tab Height May Be < 44px

**Status**: 🟡 Open | **Priority**: Medium | **Severity**: Medium

**Component**: Tab triggers
**File**: `/src/components/questionnaires/questionnaire-create-form.tsx`
**Lines**: 412-417

#### Problem Description

Tab triggers don't have explicit height, may be less than WCAG 2.2 minimum (44px).

#### Recommended Fix

```tsx
<TabsList className="grid w-full grid-cols-3 min-h-[44px]">
  <TabsTrigger value="general" className="min-h-[44px]">...</TabsTrigger>
```

#### Estimated Time

30 minutes

---

## LOW - ISSUE-051-04

### Button Gap Too Small for Touch

**Status**: 🟢 Open | **Priority**: Low | **Severity**: Low

**Component**: Question card action buttons
**File**: `/src/components/questionnaires/question-builder.tsx`
**Lines**: 148-191

#### Problem Description

`gap-1.5` (6px) between up/down/copy/delete buttons may be too close for touch.

#### Recommended Fix

```tsx
<div className="flex gap-2 sm:gap-1.5 flex-wrap">
  {/* 8px on mobile, 6px on tablet+ */}
```

#### Estimated Time

30 minutes

---

## LOW - ISSUE-051-06

### Anonymous Checkbox Too Small to Tap

**Status**: 🟢 Open | **Priority**: Low | **Severity**: Low

**Component**: Anonymous responses checkbox
**File**: `/src/components/questionnaires/questionnaire-create-form.tsx`
**Lines**: 572-580

#### Problem Description

Checkbox doesn't have explicit height, may be < 44px.

#### Recommended Fix

```tsx
<div className="flex items-center space-x-2 min-h-[44px]">
  <Checkbox id="anonymous" ... />
  <Label htmlFor="anonymous">Allow anonymous responses</Label>
</div>
```

#### Estimated Time

15 minutes

---

## Summary Statistics

| Severity | Count | Total Time | Status |
|----------|-------|------------|--------|
| Critical | 1 | 1.5h | 🔴 Open |
| High | 1 | 0.75h | 🟡 Open |
| Medium | 3 | 5.5h | 🟡 Open |
| Low | 2 | 0.75h | 🟢 Open |
| **TOTAL** | **7** | **8.5h** | **All Open** |

**Critical Path** (Fix Before Production): Issues #07, #01 = **2.25 hours**

**Full Resolution** (All Issues): **8.5 hours**

---

## Testing Matrix

| Issue | 360px | 375px | 390px | 768px | 800px |
|-------|-------|-------|-------|-------|-------|
| 051-07 | ✗ Fail | ✗ Fail | ⚠️ Partial | ✓ Pass | ✓ Pass |
| 051-01 | ✗ Fail | ⚠️ Partial | ✓ Pass | ✓ Pass | ✓ Pass |
| 051-03 | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial | ✓ Pass | ✓ Pass |
| 051-05 | ? Unknown | ? Unknown | ? Unknown | ? Unknown | ? Unknown |
| 051-02 | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial |
| 051-04 | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial | ✓ Pass | ✓ Pass |
| 051-06 | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial | ⚠️ Partial |

**Galaxy (360px)**: Most critical device, 2 failures, 4 partial
**iPhone SE (375px)**: 1 failure, 4 partial
**Tablets (768px+)**: All pass except WCAG compliance issues

---

## Resolution Roadmap

### Phase 1: Production Blocker Fixes (2.25 hours)
Week 1, Days 1-2
- [ ] ISSUE-051-07: Action buttons overflow
- [ ] ISSUE-051-01: Tab text wrapping

### Phase 2: WCAG Compliance (5.5 hours)
Week 1, Days 3-5
- [ ] ISSUE-051-03: Question headers
- [ ] ISSUE-051-05: Date picker migration
- [ ] ISSUE-051-02: Tab height

### Phase 3: Polish (0.75 hours)
Week 2, Day 1
- [ ] ISSUE-051-04: Button gaps
- [ ] ISSUE-051-06: Checkbox height

**Total Timeline**: 1-2 weeks (depending on QA cycles)

---

## Acceptance Criteria

An issue is considered **resolved** when:

1. ✓ Fix implemented and code reviewed
2. ✓ Tested on DevTools at all breakpoints (360px, 375px, 390px, 768px, 800px)
3. ✓ Tested on real devices (iPhone SE, Galaxy, iPad)
4. ✓ No new issues introduced
5. ✓ Lighthouse accessibility score ≥ 90
6. ✓ WCAG 2.2 Level AA compliance verified
7. ✓ PR merged to main branch

---

*Last Updated: 2025-10-13 | Task #51 | Agent: A14*

# PRD-006 Task Breakdown Report

**PRD**: Questionnaire Creation Interface
**Date**: 2025-10-09
**Total Tasks**: 28
**Status**: Ready for Development

## Executive Summary

Successfully broke down PRD-006 (Questionnaire Creation Interface) into 28 atomic, well-defined tasks suitable for coding agents. All tasks are stored in the PRD database with proper dependencies, priorities, and acceptance criteria.

### Task Distribution by Priority

- **Critical**: 10 tasks (35.7%) - Core functionality
- **High**: 6 tasks (21.4%) - Important UX features
- **Medium**: 6 tasks (21.4%) - Testing & polish
- **Low**: 6 tasks (21.4%) - Nice-to-have features

### Epic Progress

- **Epic**: PRD-006 Questionnaire Creation
- **Progress**: 0/28 tasks (0%)
- **Status**: Ready to begin development

## Critical Path (P0 - Must Have)

These tasks form the minimum viable feature:

### 1. Component Foundation
**Task #32** - Create QuestionnaireCreateForm component scaffold
- **Status**: ○ Pending (Ready to start)
- **Priority**: Critical
- **Estimated**: 2-3 hours
- **Description**: Create the main client component with 3-tab structure
- **Dependencies**: None
- **Acceptance Criteria**:
  - ✓ Component uses 'use client' directive
  - ✓ Three tabs implemented: General Info, Questions, Targeting & Settings
  - ✓ Form state hooks created: title, questions array, targeting, settings
  - ✓ Component renders without errors in dev environment

**Blocks**: #33, #34, #35, #36

---

### 2. Tab Implementation (Parallel Work)

**Task #33** - Implement General Information tab
- **Priority**: Critical
- **Estimated**: 1 hour
- **Dependencies**: #32
- **Description**: Title input, metadata display, character counter
- **Blocks**: #37

**Task #34** - Integrate existing QuestionBuilder
- **Priority**: Critical
- **Estimated**: 1 hour
- **Dependencies**: #32
- **Description**: Wire up QuestionBuilder component in Questions tab
- **Blocks**: #37, #42, #43

**Task #35** - Implement Audience Targeting UI
- **Priority**: Critical
- **Estimated**: 2 hours
- **Dependencies**: #32
- **Description**: Radio buttons for targeting types, panel/village/role selectors
- **Blocks**: #37, #44

**Task #36** - Implement Response Settings UI
- **Priority**: Critical
- **Estimated**: 1 hour
- **Dependencies**: #32
- **Description**: Anonymous checkbox, limits dropdown, date pickers, max responses
- **Blocks**: #37

---

### 3. Validation & Submission

**Task #37** - Implement comprehensive form validation
- **Priority**: Critical
- **Estimated**: 2 hours
- **Dependencies**: #33, #34, #35, #36
- **Description**: Create validate() function with all validation rules
- **Acceptance Criteria**:
  - ✓ Title validation: required, 3-200 characters
  - ✓ Questions validation: at least 1 question required
  - ✓ Question text validation: EN or FR required
  - ✓ MCQ validation: minimum 2 options required
  - ✓ Date validation: end date must be after start date
- **Blocks**: #38, #39, #48

**Task #38** - Implement Save as Draft functionality
- **Priority**: Critical
- **Estimated**: 1 hour
- **Dependencies**: #37
- **Description**: Save button, POST to API, redirect, toast notification
- **Acceptance Criteria**:
  - ✓ Save as Draft button displays correctly
  - ✓ POST /api/questionnaires with status=draft successful
  - ✓ Success toast notification shown after save
  - ✓ Redirect to questionnaire list after save
- **Blocks**: #40, #41, #54

**Task #39** - Implement Publish functionality
- **Priority**: Critical
- **Estimated**: 2 hours
- **Dependencies**: #37
- **Description**: Publish button, confirmation dialog, pre-publish checklist
- **Acceptance Criteria**:
  - ✓ Publish button enabled only when form valid
  - ✓ Confirmation dialog shown before publish
  - ✓ Pre-publish checklist displayed in dialog
  - ✓ Success message shows estimated reach after publish
- **Blocks**: #40, #41, #45

---

### 4. Page Integration

**Task #40** - Update /research/questionnaires/new page
- **Priority**: Critical
- **Estimated**: 1 hour
- **Dependencies**: #38
- **Description**: Replace placeholder, fetch panels, authenticate users
- **Acceptance Criteria**:
  - ✓ Page authenticates user as RESEARCHER/PM/ADMIN
  - ✓ Available panels fetched from database with member counts
  - ✓ QuestionnaireCreateForm renders with panels prop
  - ✓ Breadcrumb with back button to questionnaire list
- **Blocks**: #46, #47, #50

**Task #41** - Add comprehensive form submission error handling
- **Priority**: Critical
- **Estimated**: 1 hour
- **Dependencies**: #38, #39
- **Description**: Handle network failures, API errors, validation errors
- **Blocks**: #49, #53

---

## High Priority (P1 - Should Have)

### User Experience Enhancements

**Task #42** - Implement Preview Mode
- **Priority**: High
- **Estimated**: 2 hours
- **Dependencies**: #34
- **Description**: Modal/dialog showing questionnaire as respondents see it

**Task #43** - Add bilingual text field support
- **Priority**: High
- **Estimated**: 1 hour
- **Dependencies**: #34
- **Description**: EN/FR tab switcher, language completeness indicator

**Task #44** - Implement estimated audience size calculation
- **Priority**: High
- **Estimated**: 1 hour
- **Dependencies**: #35
- **Description**: Calculate and display estimated reach dynamically

**Task #45** - Add pre-publish validation checklist UI
- **Priority**: High
- **Estimated**: 1 hour
- **Dependencies**: #39
- **Description**: Visual checklist in publish confirmation dialog

**Task #46** - Implement responsive design
- **Priority**: High
- **Estimated**: 2 hours
- **Dependencies**: #40
- **Description**: Mobile/tablet/desktop layouts, touch-friendly interactions
- **Blocks**: #51

**Task #47** - Add keyboard navigation and accessibility
- **Priority**: High
- **Estimated**: 2 hours
- **Dependencies**: #40
- **Description**: WCAG 2.1 AA compliance, screen reader support
- **Blocks**: #52

---

## Medium Priority (P2 - Testing & Polish)

### Testing Suite

**Task #48** - Write unit tests for validation logic
- **Priority**: Medium
- **Estimated**: 2 hours
- **Dependencies**: #37
- **Description**: Jest/Vitest tests for validate() function

**Task #49** - Write integration tests for form submission
- **Priority**: Medium
- **Estimated**: 2 hours
- **Dependencies**: #41
- **Description**: Test draft save, publish, error handling

**Task #50** - Test all 7 question types
- **Priority**: Medium
- **Estimated**: 1 hour
- **Dependencies**: #40
- **Description**: Manual testing of Likert, NPS, MCQ, text, number, rating

**Task #51** - Test mobile responsive layout
- **Priority**: Medium
- **Estimated**: 1 hour
- **Dependencies**: #46
- **Description**: Real device testing on iPhone, iPad, Android

**Task #52** - Test keyboard navigation and screen readers
- **Priority**: Medium
- **Estimated**: 1 hour
- **Dependencies**: #47
- **Description**: Test with keyboard-only and NVDA/VoiceOver

**Task #53** - Add loading states and optimistic UI
- **Priority**: Medium
- **Estimated**: 1 hour
- **Dependencies**: #41
- **Description**: Spinners, skeleton loaders, optimistic updates

---

## Low Priority (P3 - Nice to Have)

### Enhancement Features

**Task #54** - Add autosave drafts (every 30 seconds)
- **Priority**: Low
- **Estimated**: 2 hours
- **Dependencies**: #38
- **Description**: Background autosave with last saved timestamp

**Task #55** - Add question templates
- **Priority**: Low
- **Estimated**: 2 hours
- **Dependencies**: None (Ready to start)
- **Description**: Preset questions (NPS, satisfaction, CSAT, etc.)

**Task #56** - Add inline help tooltips
- **Priority**: Low
- **Estimated**: 1 hour
- **Dependencies**: None (Ready to start)
- **Description**: ? icon tooltips explaining complex fields

**Task #57** - Add progress indicator
- **Priority**: Low
- **Estimated**: 1 hour
- **Dependencies**: None (Ready to start)
- **Description**: Show tab completion status (2/3 tabs completed)

**Task #58** - Add recently used panels quick-select
- **Priority**: Low
- **Estimated**: 1 hour
- **Dependencies**: None (Ready to start)
- **Description**: Track last 5 panels in localStorage

**Task #59** - Add export questionnaire as PDF/JSON
- **Priority**: Low
- **Estimated**: 2 hours
- **Dependencies**: None (Ready to start)
- **Description**: Export button with PDF/JSON options

---

## Dependency Graph

```
#32 (Component Scaffold) [READY TO START]
├── #33 (General Info)
├── #34 (Questions Tab)
│   ├── #42 (Preview Mode)
│   └── #43 (Bilingual Support)
├── #35 (Targeting)
│   └── #44 (Audience Size)
└── #36 (Response Settings)
    │
    └─→ #37 (Validation)
        ├── #38 (Save Draft)
        │   ├── #40 (Page Integration)
        │   │   ├── #46 (Responsive)
        │   │   │   └── #51 (Mobile Testing)
        │   │   ├── #47 (Accessibility)
        │   │   │   └── #52 (A11y Testing)
        │   │   └── #50 (Question Types Testing)
        │   ├── #41 (Error Handling)
        │   │   ├── #49 (Integration Tests)
        │   │   └── #53 (Loading States)
        │   ├── #48 (Unit Tests)
        │   └── #54 (Autosave)
        └── #39 (Publish)
            ├── #40 (Page Integration) [shared]
            ├── #41 (Error Handling) [shared]
            └── #45 (Validation Checklist)

Independent (No Dependencies):
├── #55 (Question Templates) [READY TO START]
├── #56 (Help Tooltips) [READY TO START]
├── #57 (Progress Indicator) [READY TO START]
├── #58 (Recently Used Panels) [READY TO START]
└── #59 (Export Feature) [READY TO START]
```

---

## Ready to Start (7 Tasks)

These tasks have no dependencies and can begin immediately:

1. **#32** - Component scaffold [Critical] ⭐ **START HERE**
2. #28 - Image auto-compression [Low]
3. #55 - Question templates [Low]
4. #56 - Help tooltips [Low]
5. #57 - Progress indicator [Low]
6. #58 - Recently used panels [Low]
7. #59 - Export feature [Low]

**Recommendation**: Start with **Task #32** (Component scaffold) as it unblocks the entire critical path.

---

## Work Assignment Suggestions

### Agent 1: Frontend Core (Critical Path)
- **Week 1**: Tasks #32, #33, #34, #35, #36 (Component scaffold + tabs)
- **Week 2**: Tasks #37, #38, #39 (Validation + submission)
- **Week 3**: Task #40, #41 (Page integration + error handling)

### Agent 2: UX/UI Enhancements (High Priority)
- **Week 2-3**: Tasks #42, #43, #44, #45 (Preview, bilingual, audience size, checklist)
- **Week 3**: Tasks #46, #47 (Responsive design + accessibility)

### Agent 3: Testing & Polish (Medium Priority)
- **Week 3**: Tasks #48, #49 (Unit + integration tests)
- **Week 4**: Tasks #50, #51, #52, #53 (Device testing + loading states)

### Agent 4: Nice-to-Have Features (Low Priority)
- **Parallel Work**: Tasks #55, #56, #57, #58, #59 (Templates, tooltips, etc.)

---

## Success Metrics

### Development Metrics
- **Total Estimated Time**: ~35-40 hours
- **Critical Path Time**: ~16 hours (2 dev days)
- **Full Feature Time**: ~35 hours (~1 week with 3-4 agents)

### Acceptance Metrics
- ✅ All 10 critical tasks completed
- ✅ All 6 high-priority UX tasks completed
- ✅ Form validates correctly (unit tests pass)
- ✅ No TypeScript errors
- ✅ Responsive on mobile/tablet/desktop
- ✅ WCAG 2.1 AA compliant

### PRD Goals Alignment
- ✅ Visual questionnaire builder (FR-2) - Tasks #32-#36
- ✅ Audience targeting (FR-3) - Task #35
- ✅ Response configuration (FR-4) - Task #36
- ✅ Draft/Publish workflow (FR-5, FR-7) - Tasks #38, #39
- ✅ Preview mode (FR-6) - Task #42
- ✅ Validation & error handling (FR-8) - Tasks #37, #41

---

## Next Steps

1. **Immediate**: Assign **Task #32** to a frontend agent (shadcn-design-engineer or fullstack agent)
2. **Day 1-2**: Complete tasks #32-#36 (component scaffold + all tabs)
3. **Day 3**: Complete tasks #37-#39 (validation + submission)
4. **Day 4**: Complete tasks #40-#41 (page integration + error handling)
5. **Week 2**: High-priority UX enhancements (#42-#47)
6. **Week 3**: Testing & polish (#48-#53)
7. **Optional**: Low-priority features (#54-#59) as time permits

---

## Commands Reference

```bash
# View all PRD-006 tasks
./tools/prd/target/release/prd list --epic "PRD-006 Questionnaire Creation"

# View tasks ready to start
./tools/prd/target/release/prd ready

# Start work on task #32
./tools/prd/target/release/prd sync <agent-name> "#32"

# View task details
./tools/prd/target/release/prd show "#32"

# View acceptance criteria
./tools/prd/target/release/prd ac "#32" list

# Complete task
./tools/prd/target/release/prd complete "#32"

# View epic progress
./tools/prd/target/release/prd epics | grep "PRD-006"

# View critical tasks
./tools/prd/target/release/prd list --epic "PRD-006 Questionnaire Creation" --priority critical
```

---

## Files to Create/Modify

### New Files
- `src/components/questionnaires/questionnaire-create-form.tsx` - Main form component
- `src/components/questionnaires/questionnaire-preview-modal.tsx` - Preview dialog
- `src/components/questionnaires/audience-targeting-selector.tsx` - Targeting UI
- `src/components/questionnaires/response-settings-form.tsx` - Response config UI

### Files to Modify
- `src/app/(authenticated)/research/questionnaires/new/page.tsx` - Replace placeholder
- `src/components/questionnaires/question-builder.tsx` - Add bilingual support (if needed)

### Test Files to Create
- `src/components/questionnaires/__tests__/questionnaire-create-form.test.tsx`
- `src/lib/__tests__/questionnaire-validation.test.ts`
- `e2e/questionnaire-creation.spec.ts`

---

## Related Documentation

- **PRD**: `/docs/prd/PRD-006.md` - Full product requirements
- **API Docs**: `POST /api/questionnaires` (already exists)
- **Prisma Schema**: `schema.prisma:364-421` (Questionnaire model)
- **TypeScript Types**: `src/types/questionnaire.ts` (Question interfaces)
- **Existing Components**:
  - `src/components/questionnaires/question-builder.tsx` (Reuse)
  - `src/components/questionnaires/questionnaire-edit-form.tsx` (Reference)

---

## Conclusion

PRD-006 has been successfully broken down into 28 well-defined, atomic tasks with:
- ✅ Clear priorities (Critical → High → Medium → Low)
- ✅ Proper dependencies (no circular dependencies)
- ✅ Acceptance criteria for key tasks
- ✅ Estimated effort for each task
- ✅ Ready-to-start tasks identified

**The critical path is ready for immediate development starting with Task #32.**

---

**Generated**: 2025-10-09
**Tool**: PRD Task Breakdown via `/breakdown` command
**Database**: `tools/prd/prd.db`
**Total Tasks**: 28
**Epic**: PRD-006 Questionnaire Creation

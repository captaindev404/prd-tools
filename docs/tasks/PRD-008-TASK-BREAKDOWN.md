# PRD-008: Simplify Questionnaires to English-Only - Task Breakdown

**Status**: Ready for Execution
**Created**: 2025-10-10
**Epic**: PRD-008: Simplify Questionnaires
**Total Tasks**: 13
**Estimated Duration**: 630 minutes (~10.5 hours)

## Executive Summary

PRD-008 has been broken down into 13 small, executable tasks stored in the PRD tool database. Tasks are organized with proper dependencies, acceptance criteria, and estimated durations. Five specialized agents have been created to work on different aspects of the project.

## Task Overview

### Critical Priority (4 tasks - 255 minutes)
These tasks form the core of the English-only migration:

1. **#1: Update validation schema to English-only** (60 min)
   - Remove bilingual QuestionText interface
   - Update Zod schemas to validate plain strings
   - **Blocks**: #3, #6, #7, #9
   - **Ready to start**: Yes ✅

2. **#3: Update QuestionBuilder component to English-only** (90 min)
   - Replace BilingualTextField with standard Textarea
   - Remove EN/FR tabs from UI
   - **Depends on**: #1, #2
   - **Blocks**: #5, #10, #11

3. **#6: Update POST /api/questionnaires endpoint** (60 min)
   - Add normalization logic for old format
   - Update validation to new schema
   - **Depends on**: #1, #2

4. **#7: Update PATCH /api/questionnaires/[id] endpoint** (45 min)
   - Add normalization logic
   - Handle backward compatibility
   - **Depends on**: #1, #2

### High Priority (5 tasks - 300 minutes)
Supporting tasks for core functionality:

5. **#2: Add backward compatibility helper function** (30 min)
   - Create normalizeQuestionText() utility
   - Handle both string and {en, fr} formats
   - **Blocks**: #3, #6, #7, #8
   - **Ready to start**: Yes ✅

6. **#5: Update QuestionnaireCreateForm to remove language state** (60 min)
   - Remove language selection UI
   - Simplify form logic
   - **Depends on**: #3

7. **#8: Update question renderer for backward compatibility** (45 min)
   - Add fallback logic for old format
   - Ensure old questionnaires render
   - **Depends on**: #2

8. **#9: Update validation tests** (60 min)
   - Remove bilingual test cases
   - Add English-only tests
   - **Depends on**: #1
   - **Ready to start**: Yes (after #1)

9. **#10: Update QuestionBuilder component tests** (45 min)
   - Update test data and assertions
   - Add backward compatibility tests
   - **Depends on**: #3

### Medium Priority (3 tasks - 105 minutes)
Component deprecation, E2E tests, and documentation:

10. **#4: Deprecate BilingualTextField component** (15 min)
    - Add @deprecated JSDoc comment
    - Add migration instructions
    - **Ready to start**: Yes ✅

11. **#11: Update E2E tests for questionnaire creation** (45 min)
    - Remove language tab interactions
    - Test simplified flow
    - **Depends on**: #3, #5

12. **#12: Update API documentation** (45 min)
    - Document new English-only schema
    - Add breaking change notice
    - **Ready to start**: Yes ✅

### Low Priority (1 task - 30 minutes)
User-facing documentation:

13. **#13: Update user guide and changelog** (30 min)
    - Update USER_GUIDE.md
    - Add CHANGELOG.md entry
    - **Ready to start**: Yes ✅

## Dependency Graph

```
Foundation Layer (No dependencies):
  #1 (Validation schema) ────┐
  #2 (Helper function) ──────┼─────┐
  #4 (Deprecate component)   │     │
  #12 (API docs)             │     │
  #13 (User docs)            │     │
                             ↓     ↓
Component Layer:
  #3 (QuestionBuilder) ──────┴─────┘
                             │
                             ↓
Form Layer:
  #5 (QuestionnaireForm) ────┘

API Layer:
  #6 (POST endpoint) ────────#1, #2
  #7 (PATCH endpoint) ───────#1, #2

Rendering Layer:
  #8 (Question renderer) ────#2

Testing Layer:
  #9 (Validation tests) ─────#1
  #10 (Component tests) ─────#3
  #11 (E2E tests) ───────────#3, #5
```

## Ready to Start (5 tasks)

These tasks have no pending dependencies and can be worked on immediately:

1. **#1 - Update validation schema to English-only** [Critical]
2. **#2 - Add backward compatibility helper function** [High]
3. **#4 - Deprecate BilingualTextField component** [Medium]
4. **#12 - Update API documentation** [Medium]
5. **#13 - Update user guide and changelog** [Low]

## Specialized Agents

Five agents have been created with specific responsibilities:

### A1: validation-agent
- **Expertise**: Validation schemas, Zod, type definitions
- **Assigned Tasks**: #1, #9
- **Focus**: Data validation and schema updates

### A2: ui-component-agent
- **Expertise**: React components, UI/UX, Shadcn UI
- **Assigned Tasks**: #3, #4, #5, #8
- **Focus**: Component refactoring and UI simplification

### A3: api-backend-agent
- **Expertise**: API routes, Next.js, backend logic
- **Assigned Tasks**: #6, #7
- **Focus**: API endpoint updates and backward compatibility

### A4: testing-agent
- **Expertise**: Jest, Playwright, E2E testing
- **Assigned Tasks**: #9, #10, #11
- **Focus**: Test updates and verification

### A5: documentation-agent
- **Expertise**: Technical writing, API docs, user guides
- **Assigned Tasks**: #12, #13
- **Focus**: Documentation updates and release notes

## Execution Strategy

### Phase 1: Foundation (Tasks #1, #2, #4)
**Duration**: 105 minutes (~1.75 hours)
**Parallel**: All 3 can run simultaneously

1. Start A1 on #1 (validation schema)
2. Start A2 on #2 (helper function)
3. Start A2 on #4 (deprecate component)

**Result**: Core infrastructure ready for component updates

### Phase 2: Component Updates (Task #3)
**Duration**: 90 minutes
**Depends on**: Phase 1 complete

1. A2 works on #3 (QuestionBuilder)

**Result**: Question builder simplified

### Phase 3: API & Form (Tasks #5, #6, #7, #8)
**Duration**: 210 minutes (3.5 hours)
**Parallel**: Can run in parallel

1. A2 on #5 (QuestionnaireForm) - depends on #3
2. A3 on #6 (POST endpoint) - depends on Phase 1
3. A3 on #7 (PATCH endpoint) - depends on Phase 1
4. A2 on #8 (Question renderer) - depends on #2

**Result**: Full stack updated with backward compatibility

### Phase 4: Testing (Tasks #9, #10, #11)
**Duration**: 150 minutes (2.5 hours)
**Sequential**: Tests run after implementation

1. A4 on #9 (validation tests) - after #1
2. A4 on #10 (component tests) - after #3
3. A4 on #11 (E2E tests) - after #3, #5

**Result**: All tests passing

### Phase 5: Documentation (Tasks #12, #13)
**Duration**: 75 minutes (~1.25 hours)
**Parallel**: Can run anytime

1. A5 on #12 (API docs)
2. A5 on #13 (User guide)

**Result**: Documentation complete

## Using the PRD Tool

### View Tasks
```bash
cd /Users/captaindev404/Code/club-med/gentil-feedback/tools/prd

# List all PRD-008 tasks
./target/release/prd list --epic "PRD-008: Simplify Questionnaires"

# Show tasks ready to work on
./target/release/prd ready

# View specific task details
./target/release/prd show "#1" --logs

# View acceptance criteria
./target/release/prd ac "#1" list
```

### Work on Tasks
```bash
# Start work on a task
./target/release/prd sync A1 "#1"

# Check off acceptance criteria as you complete them
./target/release/prd ac "#1" check 1
./target/release/prd ac "#1" check 2

# Complete task
./target/release/prd complete "#1"

# Get next best task
./target/release/prd next --priority critical --agent A1 --sync
```

### Track Progress
```bash
# View epic progress
./target/release/prd epics

# View statistics
./target/release/prd stats

# View all agents
./target/release/prd agent-list

# Filter tasks by agent
./target/release/prd list --agent A1
```

## Key Files Referenced

### Phase 1 (Foundation)
- `src/lib/validation/questionnaire-validation.ts` - Validation schema
- `src/lib/questionnaire-helpers.ts` - Backward compatibility helper (new)
- `src/components/questionnaires/bilingual-text-field.tsx` - Deprecate

### Phase 2 (Components)
- `src/components/questionnaires/question-builder.tsx` - Main component
- `src/types/questionnaire.ts` - Type definitions

### Phase 3 (API & Forms)
- `src/app/api/questionnaires/route.ts` - POST endpoint
- `src/app/api/questionnaires/[id]/route.ts` - PATCH endpoint
- `src/components/questionnaires/questionnaire-create-form.tsx` - Form component
- Question renderer components - Backward compatibility

### Phase 4 (Testing)
- `src/lib/validation/__tests__/questionnaire-validation.test.ts`
- `src/components/questionnaires/__tests__/question-builder.test.tsx`
- `e2e/questionnaire-create-form.spec.ts`

### Phase 5 (Documentation)
- `docs/API.md` - API documentation
- `docs/USER_GUIDE.md` - User guide
- `CHANGELOG.md` - Changelog
- `README.md` - Feature list

## Success Criteria

### Technical Success
- ✅ All 56 acceptance criteria met
- ✅ All tests passing (validation, component, E2E)
- ✅ No TypeScript errors
- ✅ Backward compatibility verified
- ✅ Old bilingual data renders correctly

### Business Success
- ✅ 30% reduction in questionnaire LOC
- ✅ Cleaner UI without language tabs
- ✅ Faster development (no translation bottleneck)
- ✅ Simplified validation (no edge cases)

### Documentation Success
- ✅ API docs reflect new schema
- ✅ Breaking change notice in changelog
- ✅ Migration guide for Phase 2
- ✅ User guide updated

## Risk Mitigation

### Data Loss Prevention
- ✅ No database migration (JSON stays flexible)
- ✅ Old bilingual data preserved in database
- ✅ Backward compatibility ensures old questionnaires render

### Rollback Strategy
- ✅ Code-only changes (easy to revert)
- ✅ No destructive database operations
- ✅ Git revert available if needed

### Testing Coverage
- ✅ Validation tests (Task #9)
- ✅ Component tests (Task #10)
- ✅ E2E tests (Task #11)
- ✅ Backward compatibility tests in all layers

## Next Steps

1. **Review this breakdown** with the team
2. **Assign agents** to initial tasks (#1, #2, #4)
3. **Monitor progress** using PRD tool dashboard
4. **Execute in phases** as outlined above
5. **Track completion** using acceptance criteria
6. **Deploy** when all tests pass

## PRD Tool Database

**Location**: `/Users/captaindev404/Code/club-med/gentil-feedback/tools/prd.db`

**Stats**:
- Total tasks: 13
- Pending: 13
- Completed: 0
- Estimated time: 630 minutes (~10.5 hours)
- Agents: 5

**Epic**: PRD-008: Simplify Questionnaires - 0/13 tasks (0%)

---

**Generated**: 2025-10-10
**PRD Reference**: docs/prd/PRD-008.md
**Tool**: PRD Task Management CLI v1.0

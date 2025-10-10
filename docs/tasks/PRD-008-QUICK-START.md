# PRD-008: Quick Start Guide for Agents

## 🚀 Ready to Start NOW (5 Tasks)

These tasks have **no dependencies** and can be worked on immediately in parallel:

### 1️⃣ #1: Update validation schema to English-only [CRITICAL]
**Agent**: A1 (validation-agent)
**Time**: 60 minutes
**Priority**: Critical
```bash
cd /Users/captaindev404/Code/club-med/gentil-feedback/tools/prd
./target/release/prd sync A1 "#1"
```

**What to do**:
1. Open `src/lib/validation/questionnaire-validation.ts`
2. Remove `QuestionText` interface (lines 8-11)
3. Update `Question` interface to use `text: string` (line 24)
4. Update Zod schemas to validate string (min 5, max 500 chars)
5. Remove bilingual validation logic
6. Run tests: `npm test src/lib/validation/__tests__/questionnaire-validation.test.ts`

**Acceptance Criteria** (5 items):
```bash
./target/release/prd ac "#1" list
```

---

### 2️⃣ #2: Add backward compatibility helper function [HIGH]
**Agent**: A2 (ui-component-agent)
**Time**: 30 minutes
**Priority**: High
```bash
./target/release/prd sync A2 "#2"
```

**What to do**:
1. Create `src/lib/questionnaire-helpers.ts`
2. Add `normalizeQuestionText()` function:
   - Input: `string | { en: string; fr: string }`
   - Output: `string`
   - Logic: If string, return as-is. If object, extract `en` field
3. Add unit tests with 100% coverage
4. Export function for use in components

**Example implementation**:
```typescript
export function normalizeQuestionText(text: string | { en: string; fr: string }): string {
  if (typeof text === 'string') {
    return text;
  }
  if (text && typeof text === 'object' && text.en) {
    return text.en;
  }
  throw new Error('Invalid question text format');
}
```

---

### 3️⃣ #4: Deprecate BilingualTextField component [MEDIUM]
**Agent**: A2 (ui-component-agent)
**Time**: 15 minutes
**Priority**: Medium
```bash
./target/release/prd sync A2 "#4"
```

**What to do**:
1. Open `src/components/questionnaires/bilingual-text-field.tsx`
2. Add JSDoc comment at top:
```typescript
/**
 * @deprecated This component is deprecated as of v0.6.0.
 * Use standard Textarea component instead.
 * Bilingual support will be reintroduced in Phase 2.
 *
 * Migration:
 * - Replace BilingualTextField with <Textarea>
 * - Change value from {en, fr} to string
 * - Remove language tabs
 */
```
3. Add console.warn in component body (dev mode only)
4. Keep component functional for backward compatibility

---

### 4️⃣ #12: Update API documentation [MEDIUM]
**Agent**: A5 (documentation-agent)
**Time**: 45 minutes
**Priority**: Medium
```bash
./target/release/prd sync A5 "#12"
```

**What to do**:
1. Open `docs/API.md`
2. Update questionnaire schema to show English-only format
3. Add breaking change notice
4. Document backward compatibility (old format → new format)
5. Add examples:

**Old Format** (deprecated):
```json
{
  "text": {
    "en": "What do you think?",
    "fr": "Que pensez-vous?"
  }
}
```

**New Format**:
```json
{
  "text": "What do you think?"
}
```

6. Add Phase 2 migration guide
7. Update request/response examples

---

### 5️⃣ #13: Update user guide and changelog [LOW]
**Agent**: A5 (documentation-agent)
**Time**: 30 minutes
**Priority**: Low
```bash
./target/release/prd sync A5 "#13"
```

**What to do**:
1. Update `docs/USER_GUIDE.md`:
   - Add note: "Questionnaires are currently English-only"
   - Add banner text: "Multilingual support coming in Phase 2"
2. Update `CHANGELOG.md`:
```markdown
## v0.6.0 - 2025-10-XX

### BREAKING CHANGES
- **Questionnaires**: Simplified to English-only
  - Removed bilingual (EN/FR) question text
  - Question text is now a plain string instead of {en, fr} object
  - Backward compatibility maintained (old data renders correctly)
  - French support will be reintroduced in Phase 2

### Why English-Only?
- 30% faster development (no translation bottleneck)
- Simpler UI (no language tabs)
- Faster MVP validation
- 95% of users are English-proficient
```
3. Update `README.md` if it mentions bilingual questionnaires

---

## 📊 Progress Tracking

### Check your progress:
```bash
cd /Users/captaindev404/Code/club-med/gentil-feedback/tools/prd

# View your assigned tasks
./target/release/prd list --agent A1

# Check off acceptance criteria as you complete them
./target/release/prd ac "#1" check 1
./target/release/prd ac "#1" check 2
# ... continue for all criteria

# List acceptance criteria
./target/release/prd ac "#1" list

# Complete task when done
./target/release/prd complete "#1"

# View epic progress
./target/release/prd epics
```

### View task details:
```bash
./target/release/prd show "#1"           # Basic info
./target/release/prd show "#1" --logs    # With activity log
./target/release/prd depends "#1" --list # Dependencies
```

---

## 🎯 What Happens Next?

Once these 5 tasks are complete, the following become unblocked:

### After #1 and #2 complete:
- **#3**: Update QuestionBuilder component [CRITICAL]
- **#6**: Update POST endpoint [CRITICAL]
- **#7**: Update PATCH endpoint [CRITICAL]
- **#8**: Update question renderer [HIGH]
- **#9**: Update validation tests [HIGH]

### Task Sequencing:
```
Foundation (parallel):
  #1, #2, #4, #12, #13
     ↓
Components:
  #3 → #5
     ↓
API:
  #6, #7
     ↓
Rendering:
  #8
     ↓
Testing:
  #9, #10, #11
```

---

## 💡 Tips for Success

### For validation-agent (A1):
- Focus on schema correctness
- Ensure backward compatibility in validation
- Run tests frequently: `npm test src/lib/validation`

### For ui-component-agent (A2):
- Test components visually in browser
- Check accessibility (WCAG 2.1 AA)
- Verify responsive design (mobile/desktop)

### For api-backend-agent (A3):
- Test API endpoints with both old and new formats
- Use Postman or curl for manual testing
- Check logs for deprecation warnings

### For testing-agent (A4):
- Ensure 100% test coverage for changed code
- Test backward compatibility thoroughly
- Run full test suite: `npm test`

### For documentation-agent (A5):
- Be clear and concise
- Include code examples
- Link to related docs

---

## 🚨 Common Issues

### TypeScript errors after updating validation schema:
```bash
# Run type check
npm run type-check

# Fix import statements
# Update references from {en, fr} to string
```

### Tests failing after component updates:
```bash
# Update test data
# Remove bilingual test cases
# Add new English-only test cases
```

### Backward compatibility not working:
```bash
# Ensure normalizeQuestionText() is used
# Test with old database data
# Check fallback logic in renderers
```

---

## 📞 Need Help?

- **Full breakdown**: See `docs/tasks/PRD-008-TASK-BREAKDOWN.md`
- **PRD document**: See `docs/prd/PRD-008.md`
- **PRD tool docs**: See `tools/prd/README.md`

---

**Generated**: 2025-10-10
**Ready to start**: YES ✅
**Estimated completion**: 10.5 hours total

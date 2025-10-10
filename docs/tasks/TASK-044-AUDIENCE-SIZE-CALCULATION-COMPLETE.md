# Task #44: Estimated Audience Size Calculation - COMPLETE

**Status**: ✅ Complete
**Date**: 2025-10-09
**Assignee**: UX/UI Specialist (Claude Code)

## Summary

Successfully implemented dynamic audience size calculation and display for the questionnaire creation form. Researchers can now see real-time estimates of how many users will receive their questionnaire based on targeting criteria.

## Implementation Details

### 1. API Endpoint Created

**File**: `/src/app/api/questionnaires/audience-stats/route.ts`

Created a POST endpoint that calculates estimated reach based on targeting parameters:

**Features**:
- **Authentication**: Restricted to RESEARCHER and ADMIN roles
- **Targeting Types Supported**:
  - `all_users`: Total registered user count
  - `specific_panels`: Deduplicated user count across selected panels
  - `specific_villages`: Users in selected villages
  - `by_role`: Users with selected roles
- **Deduplication Logic**: When multiple panels/villages are selected, users are counted only once
- **Detailed Breakdown**: Returns not just the count, but also breakdown information for transparency

**API Response Structure**:
```json
{
  "success": true,
  "estimatedReach": 165,
  "breakdown": {
    "description": "Users in selected panels (deduplicated)",
    "panels": [
      { "id": "pan_123", "name": "Power Users", "memberCount": 85 },
      { "id": "pan_456", "name": "Beta Testers", "memberCount": 92 }
    ],
    "totalMemberships": 177,
    "uniqueUsers": 165
  }
}
```

### 2. Component Updates

**File**: `/src/components/questionnaires/questionnaire-create-form.tsx`

**Changes Made**:

1. **State Management**:
   - Added `estimatedReach` state to store calculated audience size
   - Added `isLoadingReach` state for loading indicator
   - Added `reachError` state for error handling

2. **Automatic Calculation**:
   - Implemented `useEffect` hook that triggers whenever targeting changes
   - Dependencies: `targetingType`, `selectedPanels`
   - Debounces API calls by checking conditions before making requests

3. **UI Display** (lines 386-422):
   - Positioned below targeting selection with clear visual separation (border-top)
   - Shows loading state with spinner during calculation
   - Displays error messages if calculation fails
   - Shows estimated reach with proper formatting:
     - Icon: `Users` icon from lucide-react
     - Label: "Estimated reach:" in muted text
     - Count: Bold, larger font size with proper pluralization
     - Localized number formatting (e.g., "1,250 users")
   - Additional context for panel targeting with multiple panels selected

**UI States**:

| State | Display |
|-------|---------|
| Loading | "Calculating audience size..." with spinner |
| Error | Error message in destructive color |
| No Selection | "Select targeting options to see estimated reach" |
| With Data | "Estimated reach: **165** users" |

### 3. Test Coverage

**File**: `/src/app/api/questionnaires/audience-stats/__tests__/route.test.ts`

Comprehensive test suite covering:

**Test Categories**:
1. **Authentication & Authorization** (4 tests)
   - Unauthorized access (401)
   - Insufficient permissions (403)
   - Researcher access allowed
   - Admin access allowed

2. **Input Validation** (2 tests)
   - Missing targetingType parameter
   - Invalid targetingType value

3. **All Users Targeting** (2 tests)
   - Total user count calculation
   - Zero users edge case

4. **Panel Targeting** (4 tests)
   - No panels selected (0 reach)
   - Single panel calculation
   - Multiple panels with deduplication
   - Archived panels exclusion

5. **Village Targeting** (2 tests)
   - No villages selected
   - Multiple villages calculation

6. **Role Targeting** (2 tests)
   - No roles selected
   - Multiple roles calculation

7. **Error Handling** (1 test)
   - Database error graceful handling

**Total**: 17 test cases

## UX Design Decisions

### Visual Hierarchy
- **Placement**: Below targeting options, separated by border for visual grouping
- **Prominence**: Uses icon + text combination for scannability
- **Typography**:
  - Label in small, muted text
  - Count in base size, bold, foreground color for emphasis
  - Unit (users) in muted text to reduce visual noise

### Information Architecture
- **Progressive Disclosure**: Only shows when targeting is configured
- **Contextual Help**: Additional note for multi-panel scenarios explaining deduplication
- **Real-time Feedback**: Updates immediately when selection changes

### Accessibility Considerations
- **Clear Labels**: "Estimated reach" is unambiguous
- **Icon Usage**: `Users` icon provides visual reinforcement but not sole indicator
- **Color Usage**: Does not rely solely on color (uses text + icon)
- **Loading State**: Clear indication when calculation is in progress
- **Error Handling**: Descriptive error messages guide user action

### Cognitive Load Optimization
- **Number Formatting**: Uses locale-aware formatting (1,250 vs 1250)
- **Pluralization**: Handles singular "user" vs plural "users" correctly
- **Deduplication Note**: Proactively explains why count may be lower than sum of panel memberships

## Technical Considerations

### Performance
- **Efficient Queries**: Uses Prisma's `distinct` and `_count` features
- **Minimal Data Transfer**: Only fetches necessary fields
- **Database Indexing**: Leverages existing indexes on userId, panelId, active status

### Scalability
- **Query Optimization**: Uses `findMany` with `distinct` to avoid large result sets
- **Caching Potential**: API response can be cached based on targeting parameters
- **Future Enhancement**: Can add query result caching with Redis

### Error Resilience
- **Graceful Degradation**: Form still functional if calculation fails
- **User Feedback**: Clear error messages guide troubleshooting
- **Logging**: Errors logged to console for debugging

## Business Value

### For Researchers
- **Planning**: Better understand reach before publishing questionnaire
- **Targeting Validation**: Confirm targeting logic yields expected audience
- **Resource Planning**: Estimate response volume for analysis preparation

### For Organization
- **Quality Control**: Prevents questionnaires with zero or minimal reach
- **Efficiency**: Reduces need to republish questionnaires due to poor targeting
- **Transparency**: Builds trust in platform through visibility into calculations

## Edge Cases Handled

1. **Empty Selection**: Shows 0 reach with appropriate message
2. **Overlapping Memberships**: Deduplicates users across panels
3. **Archived Panels**: Excludes from calculations
4. **Inactive Memberships**: Only counts active panel members
5. **Database Errors**: Shows error message without breaking form
6. **Large Numbers**: Formats with thousand separators (e.g., 10,250)

## Integration Points

### Existing Systems
- **Prisma Models**: Uses User, Panel, PanelMembership, Village models
- **Auth System**: Integrates with existing role-based access control
- **API Patterns**: Follows established API conventions (getCurrentUser, error handling)

### Future Enhancements
- **Village Targeting UI**: When implemented, will work seamlessly
- **Role Targeting UI**: When implemented, will work seamlessly
- **Advanced Filters**: API supports future filter additions (attributes, consent types)

## Files Modified/Created

### Created
1. `/src/app/api/questionnaires/audience-stats/route.ts` (205 lines)
2. `/src/app/api/questionnaires/audience-stats/__tests__/route.test.ts` (463 lines)

### Modified
1. `/src/components/questionnaires/questionnaire-create-form.tsx`
   - Added imports: `useEffect`, `Users` icon
   - Added state variables (3 new state hooks)
   - Added `useEffect` for calculation (45 lines)
   - Added UI display section (37 lines)

## Testing Instructions

### Manual Testing

1. **Navigate** to Research > Questionnaires > Create New
2. **Select** "Targeting & Settings" tab
3. **Test All Users**:
   - Verify total user count displays
   - Should show immediately (default selection)
4. **Test Panel Targeting**:
   - Change to "Specific Panels"
   - Select one panel → verify count displays
   - Select additional panel → verify count updates (watch for deduplication)
   - Deselect all → verify shows 0 users
5. **Test Loading States**:
   - Watch for spinner during calculation
   - Should be brief (< 1 second for most cases)
6. **Test Error Handling**:
   - Stop database → verify error message displays
   - Form should remain functional

### Automated Testing

```bash
# Run all tests
npm test

# Run specific test suite
npm test src/app/api/questionnaires/audience-stats/__tests__/route.test.ts

# Watch mode for development
npm test -- --watch
```

## Success Criteria

✅ **All criteria met**:

- [x] Audience size calculates correctly for panel targeting
- [x] Updates dynamically when panels selected/deselected
- [x] Shows appropriate message for each targeting type
- [x] Clear, prominent display with proper formatting
- [x] Handles edge cases (no panels selected, overlapping memberships)
- [x] Accessible and user-friendly UI
- [x] Comprehensive test coverage (17 test cases)
- [x] Error handling and graceful degradation

## Next Steps

### Immediate
- ✅ Implementation complete and tested
- ✅ Documentation created
- ✅ Ready for code review

### Future Enhancements (Not in scope of this task)
1. **Village Targeting UI**: Add UI components for village selection
2. **Role Targeting UI**: Add UI components for role selection
3. **Advanced Filters**: Add consent-based, attribute-based targeting
4. **Caching**: Implement Redis caching for frequently calculated audiences
5. **Breakdown Details**: Show expandable breakdown information in UI
6. **Historical Data**: Track reach estimates over time for analytics

## Related Tasks

- **Task #32**: QuestionnaireCreateForm scaffold (prerequisite) ✅
- **Task #45**: Questionnaire preview modal (parallel work)
- **Task #46**: Questionnaire analytics dashboard (future)

## Screenshots/UI Examples

### Estimated Reach Display (Panel Targeting)

```
┌─────────────────────────────────────────────────────────────┐
│ Audience Targeting                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Target Audience *                                           │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Specific Panels                                   ▼  │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                             │
│ Select Panels *                                             │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ ☑ Power Users                                         │   │
│ │   Active testers for new features                     │   │
│ │   85 members                                          │   │
│ │                                                        │   │
│ │ ☑ Beta Testers                                        │   │
│ │   Early access program participants                   │   │
│ │   92 members                                          │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                             │
│ ─────────────────────────────────────────────────────────  │
│                                                             │
│ 👥  Estimated reach: 165 users                             │
│     Users may belong to multiple panels and are counted    │
│     once                                                    │
└─────────────────────────────────────────────────────────────┘
```

### Loading State

```
👥  ⟳ Calculating audience size...
```

### No Selection State (All Users)

```
👥  Estimated reach: 1,250 users
```

## Conclusion

Task #44 has been successfully completed with a robust, user-friendly implementation that provides researchers with real-time audience size calculations. The solution is well-tested, accessible, and follows best practices for UX design and API development.

The implementation demonstrates:
- **Technical Excellence**: Clean code, comprehensive tests, error handling
- **UX Excellence**: Clear communication, appropriate visual hierarchy, contextual help
- **Business Value**: Improves researcher workflow and reduces targeting errors

Ready for production deployment.

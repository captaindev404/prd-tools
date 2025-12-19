# Tasks: Deactivate Story Illustrations

## Overview
Add feature flag to disable story illustrations, defaulting to `false` for V2 deferral.

## Tasks

### 1. Add Feature Flag to AppConfiguration
**File:** `infinite-stories-ios/InfiniteStories/AppConfiguration.swift`

- [x] Add `enableStoryIllustrations` static property under Feature Flags section
- [x] Set default value to `false`
- [x] Add documentation comment explaining V2 deferral

**Verification:** Build succeeds, flag accessible throughout app ✓

---

### 2. Initialize StoryViewModel from Feature Flag
**File:** `infinite-stories-ios/InfiniteStories/ViewModels/StoryViewModel.swift`

- [x] Change `enableIllustrations` initialization from `true` to `AppConfiguration.enableStoryIllustrations`
- [x] Verify existing conditional logic handles `false` case

**Verification:** Story generation skips illustration step when flag is false ✓

---

### 3. Hide Illustration Toggle in StoryGenerationView
**File:** `infinite-stories-ios/InfiniteStories/Views/StoryGeneration/StoryGenerationView.swift`

- [x] Wrap illustration toggle section in `if AppConfiguration.enableStoryIllustrations`
- [x] Ensure layout adjusts correctly when toggle hidden

**Verification:** Toggle not visible when flag is false ✓

---

### 4. Update AudioPlayerView Illustration Display
**File:** `infinite-stories-ios/InfiniteStories/Views/AudioPlayer/AudioPlayerView.swift`

- [x] Verify existing `hasIllustrations` checks handle empty illustrations
- [x] Add feature flag check to hide placeholder when feature disabled
- [x] Ensure audio-only layout works correctly

**Verification:** Audio player displays correctly without illustration carousel ✓

---

### 5. Test Story Generation Flow
**Manual Testing:**

- [ ] Generate story with flag = false
- [ ] Verify story and audio generated successfully
- [ ] Verify no illustration generation attempt
- [ ] Verify completion state is correct

---

### 6. Test Audio Playback
**Manual Testing:**

- [ ] Play story generated with flag = false
- [ ] Verify audio controls work normally
- [ ] Verify no illustration-related errors in logs
- [ ] Verify no visual glitches in player

---

### 7. Test Avatar Generation
**Manual Testing:**

- [ ] Create new hero with flag = false
- [ ] Verify avatar generation still works
- [ ] Verify avatar displays correctly

---

### 8. Test Edge Cases
**Manual Testing:**

- [ ] Open existing story with illustrations (if any)
- [ ] Verify no crash when accessing illustrations array
- [ ] Verify IllustrationSyncManager handles empty state

---

## Dependencies
- Task 2 depends on Task 1
- Tasks 3-4 depend on Task 1
- Tasks 5-8 depend on Tasks 1-4

## Parallelization
- Tasks 3 and 4 can be done in parallel after Task 1
- All testing tasks (5-8) can be done in parallel after implementation

## Implementation Status
- **Tasks 1-4:** Completed ✓
- **Tasks 5-8:** Manual testing required
- **Build Status:** BUILD SUCCEEDED ✓

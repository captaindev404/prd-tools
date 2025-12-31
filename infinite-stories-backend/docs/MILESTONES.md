# Milestones System

## Overview

The Milestones system provides gamification for the Reading Journey feature by tracking user achievements across three categories: Stories, Listening Time, and Streaks.

## API Endpoint

### GET /api/v1/analytics/milestones

Retrieves all milestones with unlock status and progress for the authenticated user.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "milestones": [
      {
        "id": "FIRST_STORY",
        "category": "stories",
        "title": "First Story",
        "description": "Listen to your first story",
        "emoji": "📖",
        "unlocked": true,
        "unlockedAt": "2025-12-01T10:30:00.000Z"
      },
      {
        "id": "STORIES_5",
        "category": "stories",
        "title": "Story Explorer",
        "description": "Listen to 5 stories",
        "emoji": "🌟",
        "unlocked": false,
        "progress": 3,
        "target": 5,
        "percentage": 60
      }
    ],
    "summary": {
      "totalMilestones": 10,
      "unlockedCount": 1,
      "newlyUnlocked": ["FIRST_STORY"]
    }
  }
}
```

**Response Fields:**
- `unlocked`: Boolean indicating if milestone is achieved
- `unlockedAt`: ISO8601 timestamp when milestone was unlocked (only for unlocked milestones)
- `progress`: Current progress value (only for locked milestones)
- `target`: Target value to unlock (only for locked milestones)
- `percentage`: Progress percentage 0-100 (only for locked milestones)
- `newlyUnlocked`: Array of milestone IDs unlocked in this request (only present if new milestones were unlocked)

## Milestone Definitions

### Stories Category
| ID | Title | Target | Description |
|---|---|---|---|
| FIRST_STORY | First Story | 1 | Listen to your first story |
| STORIES_5 | Story Explorer | 5 | Listen to 5 stories |
| STORIES_10 | Story Enthusiast | 10 | Listen to 10 stories |
| STORIES_25 | Story Connoisseur | 25 | Listen to 25 stories |
| STORIES_50 | Story Master | 50 | Listen to 50 stories |

### Listening Time Category
| ID | Title | Target | Description |
|---|---|---|---|
| LISTENING_1H | One Hour of Stories | 3600s | Listen to 1 hour of stories |
| LISTENING_5H | Five Hours of Stories | 18000s | Listen to 5 hours of stories |
| LISTENING_10H | Ten Hours of Stories | 36000s | Listen to 10 hours of stories |

### Streaks Category
| ID | Title | Target | Description |
|---|---|---|---|
| STREAK_7 | Week Streak | 7 days | Listen to stories for 7 days in a row |
| STREAK_30 | Month Streak | 30 days | Listen to stories for 30 days in a row |

**Note:** Streak milestones use the higher of `currentStreak` or `longestStreak`, meaning once achieved, they remain unlocked even if the current streak breaks.

## Architecture

### Database Schema

```prisma
model UserMilestone {
  id String @id @default(cuid())
  userId String
  milestoneId String // e.g., "FIRST_STORY", "STREAK_7"

  unlockedAt DateTime @default(now())

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, milestoneId])
  @@index([userId])
  @@index([milestoneId])
  @@index([unlockedAt])
}
```

### Components

1. **Milestone Definitions** (`lib/analytics/milestone-definitions.ts`)
   - Static definitions of all available milestones
   - Helper functions for checking unlock status
   - Progress calculation logic

2. **Milestone Service** (`lib/analytics/milestone-service.ts`)
   - `checkAndUnlockMilestones(userId)`: Checks user stats and unlocks eligible milestones
   - `getUnlockedMilestones(userId)`: Returns all unlocked milestones
   - `isMilestoneUnlocked(userId, milestoneId)`: Checks if specific milestone is unlocked
   - `unlockMilestone(userId, milestoneId)`: Manually unlock a milestone (for testing/admin)

3. **Milestones API Route** (`app/api/v1/analytics/milestones/route.ts`)
   - GET endpoint that returns all milestones with unlock/progress status
   - Automatically unlocks newly eligible milestones
   - Returns summary with newly unlocked milestones

## Unlock Detection

Milestones are automatically unlocked when the GET endpoint is called and user stats meet the criteria. The detection happens in two places:

1. **On-demand (GET /api/v1/analytics/milestones)**
   - Checks `UserAnalyticsCache` for current stats
   - Compares against milestone targets
   - Creates `UserMilestone` records for newly unlocked achievements

2. **Manual (via service)**
   - `checkAndUnlockMilestones()` can be called after analytics updates
   - Returns array of newly unlocked milestone IDs
   - Non-critical operation (won't throw errors)

## Progress Calculation

Progress is calculated differently for each category:

- **Stories**: `totalStoriesListened` compared to target
- **Listening Time**: `totalListeningTimeSeconds` compared to target (in seconds)
- **Streaks**: `max(currentStreak, longestStreak)` compared to target (in days)

Percentage is calculated as: `Math.min((current / target) * 100, 100)` and rounded to integer.

## Testing

Comprehensive test suites are available:

- **Milestone Definitions Tests** (`lib/analytics/__tests__/milestone-definitions.test.ts`)
  - 28 tests covering all helper functions and edge cases

- **Milestone Service Tests** (`lib/analytics/__tests__/milestone-service.test.ts`)
  - 17 tests covering unlock detection, persistence, and integration flows

- **Milestones Route Tests** (`app/api/v1/analytics/milestones/__tests__/route.test.ts`)
  - 20 tests covering API endpoint, progress tracking, and error handling

Total: 65 tests with 100% coverage

## Example Usage

### Client Integration

```typescript
// Fetch milestones for display
const response = await fetch('/api/v1/analytics/milestones', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data } = await response.json();

// Check for newly unlocked milestones
if (data.summary.newlyUnlocked?.length > 0) {
  // Show congratulations UI
  showMilestoneUnlockedAnimation(data.summary.newlyUnlocked);
}

// Display milestone progress
data.milestones.forEach(milestone => {
  if (milestone.unlocked) {
    renderUnlockedMilestone(milestone);
  } else {
    renderProgressBar(milestone.progress, milestone.target);
  }
});
```

### Server-side Unlock Check

```typescript
import { checkAndUnlockMilestones } from '@/lib/analytics/milestone-service';

// After completing a listening session
await updateAnalyticsCache(userId);

// Check for new milestone unlocks
const newlyUnlocked = await checkAndUnlockMilestones(userId);

if (newlyUnlocked.length > 0) {
  // Optionally send push notification
  await sendMilestoneNotification(userId, newlyUnlocked);
}
```

## Future Enhancements

Potential improvements for the milestones system:

1. **Additional Milestones**
   - Hero creation milestones
   - Custom event milestones
   - Favorite stories milestones

2. **Badges and Rewards**
   - Visual badge assets for each milestone
   - Unlock rewards (special story themes, voices, etc.)

3. **Social Features**
   - Share milestone achievements
   - Compare progress with friends
   - Leaderboards

4. **Notifications**
   - Push notifications for milestone unlocks
   - Email digest of achievements

5. **Analytics**
   - Track which milestones are most engaged
   - A/B test milestone targets
   - User retention correlation with milestone engagement

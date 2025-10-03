import type { SessionUser } from './auth-helpers';
import type { RoadmapItem as PrismaRoadmapItem, Feature, Feedback } from '@prisma/client';
import { hasRole } from './auth-helpers';

/**
 * Roadmap helper functions
 */

/**
 * Checks if user can create roadmap items
 * @param user - Session user
 * @returns True if user can create roadmap items
 */
export function canCreateRoadmap(user: SessionUser): boolean {
  return hasRole(user, ['PM', 'PO', 'ADMIN']);
}

/**
 * Checks if user can edit a roadmap item
 * Rules:
 * - User is creator/owner
 * - OR user has PM/PO/ADMIN role
 * @param user - Session user
 * @param roadmapItem - Roadmap item
 * @returns True if user can edit
 */
export function canEditRoadmap(
  user: SessionUser,
  roadmapItem: { createdById: string }
): boolean {
  // PM/PO/ADMIN can edit any roadmap item
  if (hasRole(user, ['PM', 'PO', 'ADMIN'])) {
    return true;
  }

  // Creator can edit their own roadmap item
  return user.id === roadmapItem.createdById;
}

/**
 * Checks if user can delete a roadmap item
 * Rules:
 * - User is creator/owner
 * - OR user has PM/PO/ADMIN role
 * @param user - Session user
 * @param roadmapItem - Roadmap item
 * @returns True if user can delete
 */
export function canDeleteRoadmap(
  user: SessionUser,
  roadmapItem: { createdById: string }
): boolean {
  // PM/PO/ADMIN can delete any roadmap item
  if (hasRole(user, ['PM', 'PO', 'ADMIN'])) {
    return true;
  }

  // Creator can delete their own roadmap item
  return user.id === roadmapItem.createdById;
}

/**
 * Checks if user can publish roadmap updates
 * @param user - Session user
 * @returns True if user can publish
 */
export function canPublishRoadmap(user: SessionUser): boolean {
  return hasRole(user, ['PM', 'PO', 'ADMIN']);
}

/**
 * Checks if user can view internal roadmap items
 * @param user - Session user or null
 * @returns True if user can view internal items
 */
export function canViewInternalRoadmap(user: SessionUser | null): boolean {
  if (!user) return false;
  return hasRole(user, ['PM', 'PO', 'ADMIN']);
}

/**
 * Formats target date for display
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export function formatTargetDate(date: string | Date | null): string {
  if (!date) return 'No target date';

  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  // Calculate days difference
  const diffTime = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Format date as MMM DD, YYYY
  const formatted = targetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Add relative time indicator
  if (diffDays < 0) {
    return `${formatted} (${Math.abs(diffDays)} days ago)`;
  } else if (diffDays === 0) {
    return `${formatted} (Today)`;
  } else if (diffDays === 1) {
    return `${formatted} (Tomorrow)`;
  } else if (diffDays <= 7) {
    return `${formatted} (in ${diffDays} days)`;
  } else if (diffDays <= 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${formatted} (in ${weeks} week${weeks > 1 ? 's' : ''})`;
  } else if (diffDays <= 365) {
    const months = Math.floor(diffDays / 30);
    return `${formatted} (in ${months} month${months > 1 ? 's' : ''})`;
  }

  return formatted;
}

/**
 * Calculates progress percentage from linked features
 * Auto-calculates based on feature statuses if progress is not manually set
 * @param features - Array of linked features
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(
  features: Array<{ status: string }>
): number {
  if (!features || features.length === 0) return 0;

  const statusWeights: Record<string, number> = {
    idea: 0,
    discovery: 20,
    shaping: 40,
    in_progress: 60,
    released: 80,
    generally_available: 100,
    deprecated: 100, // Deprecated counts as complete
  };

  const totalProgress = features.reduce((sum, feature) => {
    return sum + (statusWeights[feature.status] || 0);
  }, 0);

  return Math.round(totalProgress / features.length);
}

/**
 * Gets stage color for UI display
 * @param stage - Roadmap stage
 * @returns Tailwind color class
 */
export function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    now: 'green',
    next: 'blue',
    later: 'gray',
    under_consideration: 'yellow',
  };

  return colors[stage] || 'gray';
}

/**
 * Gets stage label for display
 * @param stage - Roadmap stage
 * @returns Human-readable label
 */
export function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    now: 'Now',
    next: 'Next',
    later: 'Later',
    under_consideration: 'Under Consideration',
  };

  return labels[stage] || stage;
}

/**
 * Validates roadmap stage transition
 * @param currentStage - Current stage
 * @param newStage - New stage to transition to
 * @returns True if transition is valid
 */
export function isValidStageTransition(
  currentStage: string,
  newStage: string
): boolean {
  // Allow all transitions for now
  // In the future, you can add specific rules like:
  // - Can't go from 'now' to 'under_consideration'
  // - Must go through 'next' before 'now'
  // etc.

  // Valid stages
  const validStages = ['now', 'next', 'later', 'under_consideration'];

  return validStages.includes(newStage);
}

/**
 * Sorts roadmap items by target date, then by created date
 * @param items - Array of roadmap items
 * @returns Sorted array
 */
export function sortRoadmapItems<
  T extends { targetDate: Date | string | null; createdAt: Date | string }
>(items: T[]): T[] {
  return items.sort((a, b) => {
    // Items with target dates come first
    if (a.targetDate && !b.targetDate) return -1;
    if (!a.targetDate && b.targetDate) return 1;

    // Both have target dates - sort by date
    if (a.targetDate && b.targetDate) {
      const dateA =
        typeof a.targetDate === 'string'
          ? new Date(a.targetDate)
          : a.targetDate;
      const dateB =
        typeof b.targetDate === 'string'
          ? new Date(b.targetDate)
          : b.targetDate;
      return dateA.getTime() - dateB.getTime();
    }

    // Neither has target date - sort by created date
    const createdA =
      typeof a.createdAt === 'string' ? new Date(a.createdAt) : a.createdAt;
    const createdB =
      typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt;
    return createdB.getTime() - createdA.getTime(); // Newest first
  });
}

/**
 * Filters roadmap items by visibility based on user role
 * @param items - Array of roadmap items
 * @param user - Session user or null
 * @returns Filtered array
 */
export function filterByVisibility<T extends { visibility: string }>(
  items: T[],
  user: SessionUser | null
): T[] {
  // If no user, only show public items
  if (!user) {
    return items.filter((item) => item.visibility === 'public');
  }

  // If user can view internal items, show all
  if (canViewInternalRoadmap(user)) {
    return items;
  }

  // Otherwise, only show public items
  return items.filter((item) => item.visibility === 'public');
}

/**
 * Validates progress value
 * @param progress - Progress value
 * @returns True if valid (0-100)
 */
export function isValidProgress(progress: number): boolean {
  return Number.isInteger(progress) && progress >= 0 && progress <= 100;
}

/**
 * Parses JSON field safely
 * @param jsonString - JSON string
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed value or default
 */
export function parseJsonField<T>(jsonString: string, defaultValue: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return defaultValue;
  }
}

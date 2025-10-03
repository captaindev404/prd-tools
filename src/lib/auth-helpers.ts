import { auth } from '@/auth';
import type { Role } from '@prisma/client';

/**
 * Authentication helpers for API routes
 */

export interface SessionUser {
  id: string;
  email: string;
  displayName?: string | null;
  role: Role;
  currentVillageId?: string | null;
}

/**
 * Gets the current authenticated user from session
 * @returns SessionUser or null if not authenticated
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email || '',
    displayName: session.user.displayName,
    role: (session.user.role as Role) || 'USER',
    currentVillageId: session.user.currentVillageId,
  };
}

/**
 * Checks if user has any of the specified roles
 * @param user - Session user
 * @param roles - Array of roles to check
 * @returns True if user has any of the roles
 */
export function hasRole(user: SessionUser, roles: Role[]): boolean {
  return roles.includes(user.role);
}

/**
 * Checks if user is authenticated
 * @param user - Session user or null
 * @returns True if user is authenticated
 */
export function isAuthenticated(user: SessionUser | null): user is SessionUser {
  return user !== null;
}

/**
 * Checks if user can edit feedback
 * Rules:
 * - User is author AND within edit window
 * - OR user has PM/PO role
 * @param user - Session user
 * @param feedback - Feedback item
 * @returns True if user can edit
 */
export function canEditFeedback(
  user: SessionUser,
  feedback: { authorId: string; editWindowEndsAt: Date | null }
): boolean {
  // PM/PO can always edit
  if (hasRole(user, ['PM', 'PO', 'ADMIN'])) {
    return true;
  }

  // Author can edit within window
  if (user.id === feedback.authorId) {
    if (!feedback.editWindowEndsAt) return false;
    return new Date() <= feedback.editWindowEndsAt;
  }

  return false;
}

/**
 * Checks if user can moderate feedback
 * @param user - Session user
 * @returns True if user can moderate
 */
export function canModerate(user: SessionUser): boolean {
  return hasRole(user, ['MODERATOR', 'ADMIN', 'PM', 'PO']);
}

/**
 * Checks if user can merge feedback
 * @param user - Session user
 * @returns True if user can merge
 */
export function canMergeFeedback(user: SessionUser): boolean {
  return hasRole(user, ['PM', 'PO', 'MODERATOR', 'ADMIN']);
}

/**
 * Checks if user can create features
 * @param user - Session user
 * @returns True if user can create features
 */
export function canCreateFeature(user: SessionUser): boolean {
  return hasRole(user, ['PM', 'PO', 'ADMIN']);
}

/**
 * Checks if user can edit feature
 * Rules:
 * - User has PM/PO/ADMIN role
 * @param user - Session user
 * @param feature - Feature item (optional, for future owner-based checks)
 * @returns True if user can edit
 */
export function canEditFeature(
  user: SessionUser,
  feature?: { id: string }
): boolean {
  // Currently only PM/PO/ADMIN can edit features
  // In future, could add owner-based checks if Feature model gets ownerId field
  return hasRole(user, ['PM', 'PO', 'ADMIN']);
}

/**
 * Checks if user can delete feature
 * @param user - Session user
 * @returns True if user can delete
 */
export function canDeleteFeature(user: SessionUser): boolean {
  return hasRole(user, ['PM', 'PO', 'ADMIN']);
}

/**
 * Checks if user can create questionnaires
 * @param user - Session user
 * @returns True if user can create questionnaires
 */
export function canCreateQuestionnaire(user: SessionUser): boolean {
  return hasRole(user, ['RESEARCHER', 'PM', 'ADMIN']);
}

/**
 * Checks if user can edit questionnaire
 * Rules:
 * - User is creator
 * - OR user has RESEARCHER/PM/ADMIN role
 * @param user - Session user
 * @param questionnaire - Questionnaire item (optional)
 * @returns True if user can edit
 */
export function canEditQuestionnaire(
  user: SessionUser,
  questionnaire?: { createdById?: string }
): boolean {
  // RESEARCHER/PM/ADMIN can edit any questionnaire
  if (hasRole(user, ['RESEARCHER', 'PM', 'ADMIN'])) {
    return true;
  }

  // Creator can edit their own questionnaire
  if (questionnaire?.createdById && user.id === questionnaire.createdById) {
    return true;
  }

  return false;
}

/**
 * Checks if user can view questionnaire responses
 * @param user - Session user
 * @returns True if user can view responses
 */
export function canViewQuestionnaireResponses(user: SessionUser): boolean {
  return hasRole(user, ['RESEARCHER', 'PM', 'ADMIN']);
}

/**
 * Checks if user can publish questionnaire
 * @param user - Session user
 * @returns True if user can publish
 */
export function canPublishQuestionnaire(user: SessionUser): boolean {
  return hasRole(user, ['RESEARCHER', 'PM', 'ADMIN']);
}

/**
 * Checks if user can delete questionnaire
 * @param user - Session user
 * @param questionnaire - Questionnaire item
 * @returns True if user can delete
 */
export function canDeleteQuestionnaire(
  user: SessionUser,
  questionnaire?: { createdById?: string }
): boolean {
  // ADMIN can delete any questionnaire
  if (hasRole(user, ['ADMIN'])) {
    return true;
  }

  // Creator can delete their own questionnaire
  if (questionnaire?.createdById && user.id === questionnaire.createdById) {
    return true;
  }

  return false;
}

/**
 * Checks if user can create panels
 * @param user - Session user
 * @returns True if user can create panels
 */
export function canCreatePanel(user: SessionUser): boolean {
  return hasRole(user, ['RESEARCHER', 'PM', 'ADMIN']);
}

/**
 * Checks if user can edit panel
 * Rules:
 * - User is creator
 * - OR user has RESEARCHER/PM/ADMIN role
 * @param user - Session user
 * @param panel - Panel item (optional)
 * @returns True if user can edit
 */
export function canEditPanel(
  user: SessionUser,
  panel?: { createdById?: string }
): boolean {
  // RESEARCHER/PM/ADMIN can edit any panel
  if (hasRole(user, ['RESEARCHER', 'PM', 'ADMIN'])) {
    return true;
  }

  // Creator can edit their own panel
  if (panel?.createdById && user.id === panel.createdById) {
    return true;
  }

  return false;
}

/**
 * Checks if user can delete panel
 * @param user - Session user
 * @param panel - Panel item
 * @returns True if user can delete
 */
export function canDeletePanel(
  user: SessionUser,
  panel?: { createdById?: string }
): boolean {
  // ADMIN can delete any panel
  if (hasRole(user, ['ADMIN'])) {
    return true;
  }

  // Creator can delete their own panel
  if (panel?.createdById && user.id === panel.createdById) {
    return true;
  }

  return false;
}

/**
 * Checks if user can manage panel members (invite/remove)
 * @param user - Session user
 * @returns True if user can manage members
 */
export function canManagePanelMembers(user: SessionUser): boolean {
  return hasRole(user, ['RESEARCHER', 'PM', 'ADMIN']);
}

/**
 * Checks if user is an admin
 * @param user - Session user
 * @returns True if user has ADMIN role
 */
export function isAdmin(user: SessionUser): boolean {
  return user.role === 'ADMIN';
}

/**
 * Checks if user can create sessions
 * @param user - Session user
 * @returns True if user can create sessions
 */
export function canCreateSession(user: SessionUser): boolean {
  return hasRole(user, ['RESEARCHER', 'PM', 'ADMIN']);
}

/**
 * Checks if user can edit session
 * Rules:
 * - User is facilitator
 * - OR user has RESEARCHER/PM/ADMIN role
 * @param user - Session user
 * @param session - Session item (optional)
 * @returns True if user can edit
 */
export function canEditSession(
  user: SessionUser,
  session?: { facilitatorIds: string | string[] }
): boolean {
  // RESEARCHER/PM/ADMIN can edit any session
  if (hasRole(user, ['RESEARCHER', 'PM', 'ADMIN'])) {
    return true;
  }

  // Facilitators can edit their sessions
  if (session) {
    const facilitatorIds = typeof session.facilitatorIds === 'string'
      ? JSON.parse(session.facilitatorIds)
      : session.facilitatorIds;
    return facilitatorIds.includes(user.id);
  }

  return false;
}

/**
 * Checks if user can delete/cancel session
 * @param user - Session user
 * @param session - Session item
 * @returns True if user can delete
 */
export function canDeleteSession(
  user: SessionUser,
  session?: { facilitatorIds: string | string[] }
): boolean {
  // RESEARCHER/PM/ADMIN can cancel any session
  if (hasRole(user, ['RESEARCHER', 'PM', 'ADMIN'])) {
    return true;
  }

  // Facilitators can cancel their sessions
  if (session) {
    const facilitatorIds = typeof session.facilitatorIds === 'string'
      ? JSON.parse(session.facilitatorIds)
      : session.facilitatorIds;
    return facilitatorIds.includes(user.id);
  }

  return false;
}

/**
 * Checks if user can complete session
 * Rules:
 * - User must be a facilitator of the session
 * @param user - Session user
 * @param session - Session item
 * @returns True if user can complete
 */
export function canCompleteSession(
  user: SessionUser,
  session: { facilitatorIds: string | string[] }
): boolean {
  const facilitatorIds = typeof session.facilitatorIds === 'string'
    ? JSON.parse(session.facilitatorIds)
    : session.facilitatorIds;
  return facilitatorIds.includes(user.id);
}

/**
 * Checks if user can view session details
 * Rules:
 * - RESEARCHER/PM can view all
 * - Participants can view their sessions
 * - Facilitators can view their sessions
 * @param user - Session user
 * @param session - Session item
 * @returns True if user can view
 */
export function canViewSession(
  user: SessionUser,
  session: { participantIds: string | string[]; facilitatorIds: string | string[] }
): boolean {
  // RESEARCHER/PM/ADMIN can view all sessions
  if (hasRole(user, ['RESEARCHER', 'PM', 'ADMIN'])) {
    return true;
  }

  const participantIds = typeof session.participantIds === 'string'
    ? JSON.parse(session.participantIds)
    : session.participantIds;
  const facilitatorIds = typeof session.facilitatorIds === 'string'
    ? JSON.parse(session.facilitatorIds)
    : session.facilitatorIds;

  // Participants and facilitators can view
  return participantIds.includes(user.id) || facilitatorIds.includes(user.id);
}

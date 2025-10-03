import { useSession } from 'next-auth/react';
import type { Role } from '@prisma/client';

/**
 * Client-side hook for panel permissions
 *
 * Uses session data to determine what panel actions the current user can perform.
 * This mirrors the server-side permission helpers in lib/auth-helpers.ts
 */

interface Panel {
  createdById?: string;
  id?: string;
}

interface SessionUser {
  id: string;
  role: Role;
}

export function usePanelPermissions(panel?: Panel | null) {
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  /**
   * Checks if user can edit panel
   * Rules:
   * - User is creator
   * - OR user has RESEARCHER/PM/PO/ADMIN role
   */
  const canEdit = (): boolean => {
    if (!user || !panel) return false;

    // RESEARCHER/PM/PO/ADMIN can edit any panel
    if (['RESEARCHER', 'PM', 'PO', 'ADMIN'].includes(user.role)) {
      return true;
    }

    // Creator can edit their own panel
    if (panel.createdById && user.id === panel.createdById) {
      return true;
    }

    return false;
  };

  /**
   * Checks if user can delete/archive panel
   * Rules:
   * - User is creator
   * - OR user has ADMIN role
   */
  const canDelete = (): boolean => {
    if (!user || !panel) return false;

    // ADMIN can delete any panel
    if (user.role === 'ADMIN') {
      return true;
    }

    // Creator can delete their own panel
    if (panel.createdById && user.id === panel.createdById) {
      return true;
    }

    return false;
  };

  /**
   * Checks if user can invite members to panels
   * Rules:
   * - User has RESEARCHER/PM/PO/ADMIN role
   */
  const canInviteMembers = (): boolean => {
    if (!user) return false;

    return ['RESEARCHER', 'PM', 'PO', 'ADMIN'].includes(user.role);
  };

  /**
   * Gets tooltip message explaining why an action is disabled
   */
  const getTooltipMessage = (action: 'edit' | 'delete' | 'invite'): string => {
    if (!user) {
      return 'You must be signed in to perform this action';
    }

    switch (action) {
      case 'edit':
        return 'You need to be the panel creator or have RESEARCHER, PM, PO, or ADMIN role to edit this panel';
      case 'delete':
        return 'You need to be the panel creator or have ADMIN role to archive this panel';
      case 'invite':
        return 'You need RESEARCHER, PM, PO, or ADMIN role to invite members to panels';
      default:
        return 'You do not have permission to perform this action';
    }
  };

  return {
    canEdit: canEdit(),
    canDelete: canDelete(),
    canInviteMembers: canInviteMembers(),
    getTooltipMessage,
    isAuthenticated: !!user,
    user,
  };
}

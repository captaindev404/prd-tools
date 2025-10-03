import type { Role } from '@prisma/client';

/**
 * Panel Eligibility Logic
 * Handles checking user eligibility for panels based on criteria
 */

export interface EligibilityCriteria {
  include_roles?: Role[];
  include_villages?: string[];
  attributes_predicates?: AttributePredicate[];
  required_consents?: string[];
  min_tenure_days?: number;
}

export interface AttributePredicate {
  key: string;
  op: 'in' | 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  value: any;
}

export interface UserForEligibility {
  id: string;
  role: Role;
  currentVillageId?: string | null;
  consents: string; // JSON string
  villageHistory: string; // JSON string
  createdAt: Date;
  email: string;
}

/**
 * Validates eligibility criteria JSON structure
 * @param criteria - Eligibility criteria object
 * @returns Validation result with errors
 */
export function validateCriteria(criteria: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (typeof criteria !== 'object' || criteria === null) {
    errors.push('Eligibility criteria must be an object');
    return { valid: false, errors };
  }

  // Validate include_roles
  if (criteria.include_roles !== undefined) {
    if (!Array.isArray(criteria.include_roles)) {
      errors.push('include_roles must be an array');
    } else {
      const validRoles: Role[] = ['USER', 'PM', 'PO', 'RESEARCHER', 'ADMIN', 'MODERATOR'];
      const invalidRoles = criteria.include_roles.filter(
        (role: any) => !validRoles.includes(role)
      );
      if (invalidRoles.length > 0) {
        errors.push(`Invalid roles: ${invalidRoles.join(', ')}`);
      }
    }
  }

  // Validate include_villages
  if (criteria.include_villages !== undefined) {
    if (!Array.isArray(criteria.include_villages)) {
      errors.push('include_villages must be an array');
    }
  }

  // Validate attributes_predicates
  if (criteria.attributes_predicates !== undefined) {
    if (!Array.isArray(criteria.attributes_predicates)) {
      errors.push('attributes_predicates must be an array');
    } else {
      criteria.attributes_predicates.forEach((pred: any, index: number) => {
        if (typeof pred !== 'object' || !pred.key || !pred.op) {
          errors.push(`Predicate at index ${index} is invalid (must have key, op, and value)`);
        }
        if (
          pred.op &&
          !['in', 'eq', 'gt', 'lt', 'gte', 'lte', 'contains'].includes(pred.op)
        ) {
          errors.push(`Predicate at index ${index} has invalid operator: ${pred.op}`);
        }
      });
    }
  }

  // Validate required_consents
  if (criteria.required_consents !== undefined) {
    if (!Array.isArray(criteria.required_consents)) {
      errors.push('required_consents must be an array');
    }
  }

  // Validate min_tenure_days
  if (criteria.min_tenure_days !== undefined) {
    if (typeof criteria.min_tenure_days !== 'number' || criteria.min_tenure_days < 0) {
      errors.push('min_tenure_days must be a non-negative number');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Checks if a user meets eligibility criteria
 * @param user - User object with eligibility fields
 * @param criteria - Eligibility criteria
 * @returns True if user meets all criteria
 */
export function checkEligibility(
  user: UserForEligibility,
  criteria: EligibilityCriteria
): { eligible: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Parse user consents
  let userConsents: string[] = [];
  try {
    userConsents = JSON.parse(user.consents);
  } catch {
    userConsents = [];
  }

  // Check role requirement
  if (criteria.include_roles && criteria.include_roles.length > 0) {
    if (!criteria.include_roles.includes(user.role)) {
      reasons.push(
        `User role '${user.role}' is not in required roles: ${criteria.include_roles.join(', ')}`
      );
    }
  }

  // Check village requirement
  if (criteria.include_villages && criteria.include_villages.length > 0) {
    // Check if user's current village is in the list or "all" is specified
    const hasAll = criteria.include_villages.some(
      (v) => v === 'all' || v === 'vlg-*' || v === '*'
    );
    if (!hasAll) {
      if (!user.currentVillageId) {
        reasons.push('User has no current village');
      } else if (!criteria.include_villages.includes(user.currentVillageId)) {
        reasons.push(
          `User village '${user.currentVillageId}' is not in required villages: ${criteria.include_villages.join(', ')}`
        );
      }
    }
  }

  // Check consent requirements
  if (criteria.required_consents && criteria.required_consents.length > 0) {
    const missingConsents = criteria.required_consents.filter(
      (consent) => !userConsents.includes(consent)
    );
    if (missingConsents.length > 0) {
      reasons.push(`User is missing required consents: ${missingConsents.join(', ')}`);
    }
  }

  // Check minimum tenure
  if (criteria.min_tenure_days !== undefined && criteria.min_tenure_days > 0) {
    const tenureDays = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (tenureDays < criteria.min_tenure_days) {
      reasons.push(
        `User tenure (${tenureDays} days) is less than required ${criteria.min_tenure_days} days`
      );
    }
  }

  // Check attribute predicates (future extension point)
  if (criteria.attributes_predicates && criteria.attributes_predicates.length > 0) {
    // For now, we don't have custom attributes on users
    // This could be extended to check village history or other metadata
    reasons.push('Attribute predicates are not yet fully supported');
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

/**
 * Builds a Prisma where clause for finding eligible users
 * @param criteria - Eligibility criteria
 * @returns Prisma where clause object
 */
export function buildEligibilityWhereClause(criteria: EligibilityCriteria): any {
  const where: any = {};

  // Role filter
  if (criteria.include_roles && criteria.include_roles.length > 0) {
    where.role = { in: criteria.include_roles };
  }

  // Village filter
  if (criteria.include_villages && criteria.include_villages.length > 0) {
    const hasAll = criteria.include_villages.some(
      (v) => v === 'all' || v === 'vlg-*' || v === '*'
    );
    if (!hasAll) {
      where.currentVillageId = { in: criteria.include_villages };
    }
  }

  // Minimum tenure filter
  if (criteria.min_tenure_days !== undefined && criteria.min_tenure_days > 0) {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - criteria.min_tenure_days);
    where.createdAt = { lte: minDate };
  }

  return where;
}

/**
 * Filters users by consent requirements (must be done in-memory due to JSON field)
 * @param users - List of users with consents
 * @param requiredConsents - Required consent flags
 * @returns Filtered users who have all required consents
 */
export function filterUsersByConsents(
  users: UserForEligibility[],
  requiredConsents: string[]
): UserForEligibility[] {
  if (!requiredConsents || requiredConsents.length === 0) {
    return users;
  }

  return users.filter((user) => {
    let userConsents: string[] = [];
    try {
      userConsents = JSON.parse(user.consents);
    } catch {
      userConsents = [];
    }

    return requiredConsents.every((consent) => userConsents.includes(consent));
  });
}

/**
 * Gets a human-readable description of eligibility criteria
 * @param criteria - Eligibility criteria
 * @returns Formatted description
 */
export function formatCriteria(criteria: EligibilityCriteria): {
  roles?: string;
  villages?: string;
  consents?: string;
  tenure?: string;
  predicates?: string;
} {
  const formatted: any = {};

  if (criteria.include_roles && criteria.include_roles.length > 0) {
    formatted.roles = criteria.include_roles.join(', ');
  }

  if (criteria.include_villages && criteria.include_villages.length > 0) {
    const hasAll = criteria.include_villages.some(
      (v) => v === 'all' || v === 'vlg-*' || v === '*'
    );
    formatted.villages = hasAll ? 'All villages' : criteria.include_villages.join(', ');
  }

  if (criteria.required_consents && criteria.required_consents.length > 0) {
    formatted.consents = criteria.required_consents.join(', ');
  }

  if (criteria.min_tenure_days !== undefined && criteria.min_tenure_days > 0) {
    formatted.tenure = `At least ${criteria.min_tenure_days} days`;
  }

  if (criteria.attributes_predicates && criteria.attributes_predicates.length > 0) {
    formatted.predicates = `${criteria.attributes_predicates.length} custom rule(s)`;
  }

  return formatted;
}

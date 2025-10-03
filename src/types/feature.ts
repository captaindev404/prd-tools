import type { ProductArea, FeatureStatus } from '@prisma/client';

/**
 * Type definitions for Feature domain
 */

export interface CreateFeatureInput {
  title: string;
  description?: string;
  area: ProductArea;
  status?: FeatureStatus;
}

export interface UpdateFeatureInput {
  title?: string;
  description?: string;
  area?: ProductArea;
  status?: FeatureStatus;
}

export interface FeatureFilters {
  area?: ProductArea;
  status?: FeatureStatus;
  search?: string;
}

/**
 * Valid feature status transitions per DSL spec
 * idea → discovery → shaping → in_progress → released → GA → deprecated
 */
export const VALID_STATUS_TRANSITIONS: Record<FeatureStatus, FeatureStatus[]> = {
  idea: ['discovery', 'deprecated'],
  discovery: ['shaping', 'idea', 'deprecated'],
  shaping: ['in_progress', 'discovery', 'deprecated'],
  in_progress: ['released', 'shaping', 'deprecated'],
  released: ['generally_available', 'deprecated'],
  generally_available: ['deprecated'],
  deprecated: [], // Terminal state
};

/**
 * Validates if a status transition is allowed
 */
export function isValidStatusTransition(
  currentStatus: FeatureStatus,
  newStatus: FeatureStatus
): boolean {
  if (currentStatus === newStatus) return true;
  return VALID_STATUS_TRANSITIONS[currentStatus].includes(newStatus);
}

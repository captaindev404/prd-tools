/**
 * Type definitions for Research Panels
 * Based on DSL spec in dsl/global.yaml (lines 155-173)
 */

/**
 * Quota key types for demographic sampling
 */
export type QuotaKey = 'department' | 'role' | 'village_id' | string;

/**
 * Quota distribution strategy
 */
export type QuotaDistribution = 'proportional' | 'equal' | 'custom';

/**
 * Individual quota configuration
 */
export interface Quota {
  id: string;
  key: QuotaKey;
  targetPercentage: number;
  distribution?: QuotaDistribution;
}

/**
 * Quota with current progress
 */
export interface QuotaWithProgress extends Quota {
  currentCount: number;
  currentPercentage: number;
  targetCount?: number;
}

/**
 * Quota validation result
 */
export interface QuotaValidation {
  isValid: boolean;
  totalPercentage: number;
  errors: string[];
  warnings: string[];
}

/**
 * Eligibility attribute predicate operators
 */
export type PredicateOperator = 'in' | 'equals' | 'contains' | 'gt' | 'lt';

/**
 * Eligibility attribute predicate
 */
export interface AttributePredicate {
  key: string;
  op: PredicateOperator;
  value: string | string[] | number;
}

/**
 * Panel eligibility rules
 */
export interface EligibilityRules {
  includeRoles?: string[];
  includeVillages?: string[];
  attributesPredicates?: AttributePredicate[];
  requiredConsents?: string[];
}

/**
 * Research panel interface
 */
export interface Panel {
  id: string;
  name: string;
  description: string;
  createdById: string;
  archived: boolean;
  eligibilityRules: EligibilityRules;
  sizeTarget: number;
  quotas?: Quota[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Panel with member counts
 */
export interface PanelWithCounts extends Panel {
  memberCount: number;
  eligibleCount: number;
  quotaProgress?: QuotaWithProgress[];
}

/**
 * Panel list item
 */
export interface PanelListItem {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  sizeTarget: number;
  archived: boolean;
  createdAt: Date;
  creator?: {
    id: string;
    displayName?: string | null;
    email: string;
  };
}

/**
 * Create panel input
 */
export interface CreatePanelInput {
  name: string;
  description: string;
  eligibilityRules: EligibilityRules;
  sizeTarget: number;
  quotas?: Omit<Quota, 'id'>[];
}

/**
 * Update panel input
 */
export interface UpdatePanelInput {
  name?: string;
  description?: string;
  eligibilityRules?: EligibilityRules;
  sizeTarget?: number;
  quotas?: Quota[];
  archived?: boolean;
}

/**
 * Eligible user in preview sample
 */
export interface EligibleUser {
  id: string;
  employeeId: string | null;
  email: string;
  displayName: string | null;
  role: string;
  villageId: string | null;
}

/**
 * Eligibility preview data
 */
export interface EligibilityPreviewData {
  count: number;
  sample: EligibleUser[];
  note?: string;
}

/**
 * Eligibility preview API response
 */
export interface EligibilityPreviewResponse {
  success: boolean;
  data: EligibilityPreviewData;
}

/**
 * Type definitions for Questionnaire Targeting Configuration
 * Based on DSL spec in dsl/global.yaml (lines 190-199)
 */

export type DeliveryMode = 'in-app' | 'email';

/**
 * Targeting configuration for questionnaires
 */
export interface TargetingConfig {
  // Panel-based targeting
  panelIds?: string[];

  // Ad-hoc filters
  villageIds?: string[];
  roles?: string[];
  featureInteractions?: string[];

  // Delivery configuration
  deliveryModes: DeliveryMode[];
  startAt?: Date | null;
  endAt?: Date | null;
  maxResponses?: number | null;
}

/**
 * Targeting configuration as stored in database (with serialized dates)
 */
export interface TargetingConfigData {
  panelIds?: string[];
  villageIds?: string[];
  roles?: string[];
  featureInteractions?: string[];
  deliveryModes: DeliveryMode[];
  startAt?: string | null;
  endAt?: string | null;
  maxResponses?: number | null;
}

/**
 * Options for targeting dropdowns
 */
export interface TargetingOptions {
  panels: Array<{ id: string; name: string }>;
  villages: Array<{ id: string; name: string }>;
  features: Array<{ id: string; name: string }>;
}

/**
 * Audience preview result
 */
export interface AudiencePreview {
  estimatedCount: number;
  breakdown: {
    byPanel?: Record<string, number>;
    byVillage?: Record<string, number>;
    byRole?: Record<string, number>;
  };
}

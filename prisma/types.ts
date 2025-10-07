/**
 * Additional TypeScript types for Gentil Feedback
 * These complement the Prisma-generated types with domain-specific structures
 */

// ========== JSON Field Types ==========

/**
 * GDPR Consent types as stored in User.consents JSON field
 */
export type ConsentType = 'research_contact' | 'usage_analytics' | 'email_updates';

/**
 * Village history entry as stored in User.villageHistory JSON array
 */
export interface VillageHistoryEntry {
  village_id: string;
  from: string; // ISO date string
  to: string | null; // ISO date string or null if current
}

/**
 * Moderation signal types as stored in Feedback.moderationSignals JSON array
 */
export type ModerationSignal = 'toxicity' | 'spam' | 'pii' | 'off_topic';

/**
 * Panel eligibility rules as stored in Panel.eligibilityRules JSON object
 */
export interface PanelEligibilityRules {
  include_roles: string[];
  include_villages: string[];
  attributes_predicates?: Array<{
    key: string;
    op: 'in' | 'equals' | 'not_equals' | 'contains';
    value: any;
  }>;
  required_consents: ConsentType[];
}

/**
 * Panel quota as stored in Panel.quotas JSON array
 */
export interface PanelQuota {
  key: string;
  distribution: 'proportional' | 'equal' | 'fixed';
  values?: Record<string, number>;
}

/**
 * Question types for questionnaires
 */
export type QuestionType = 'likert' | 'nps' | 'mcq' | 'checkbox' | 'text' | 'number';

/**
 * Questionnaire question as stored in Questionnaire.questions JSON array
 */
export interface Question {
  id: string;
  type: QuestionType;
  text: {
    en: string;
    fr: string;
  };
  scale?: string; // e.g., "1-5", "0-10"
  options?: string[]; // for MCQ/checkbox
  required: boolean;
}

/**
 * Ad-hoc filters as stored in Questionnaire.adHocFilters JSON object
 */
export interface AdHocFilters {
  villages?: string[];
  features_interacted?: string[];
  roles?: string[];
  [key: string]: any;
}

/**
 * Roadmap communication audience filters
 */
export interface RoadmapAudience {
  villages: string[];
  roles: string[];
  languages: string[];
}

/**
 * Event payload types based on event type
 */
export type EventPayload =
  | FeedbackCreatedPayload
  | FeedbackMergedPayload
  | VoteCastPayload
  | RoadmapPublishedPayload
  | QuestionnaireResponsePayload
  | SessionCompletedPayload;

export interface FeedbackCreatedPayload {
  feedback_id: string;
  author_id: string;
  village_id?: string;
  feature_refs: string[];
  source: string;
}

export interface FeedbackMergedPayload {
  from_feedback_id: string;
  to_feedback_id: string;
  by_user_id: string;
}

export interface VoteCastPayload {
  feedback_id: string;
  voter_id: string;
  weight: number;
}

export interface RoadmapPublishedPayload {
  roadmap_item_id: string;
  stage: string;
}

export interface QuestionnaireResponsePayload {
  questionnaire_id: string;
  respondent_id: string;
  score_map: Record<string, number>;
  free_text_redacted?: boolean;
}

export interface SessionCompletedPayload {
  session_id: string;
  participant_ids: string[];
  notes_uri?: string;
}

// ========== Computed/Derived Types ==========

/**
 * Vote weight calculation inputs
 */
export interface VoteWeightFactors {
  role_weight: number;
  village_priority: number;
  panel_member_boost: number;
  decay_factor: number;
}

/**
 * Feedback metrics
 */
export interface FeedbackMetrics {
  total_votes: number;
  weighted_vote_sum: number;
  unique_voters: number;
  days_since_created: number;
}

/**
 * Roadmap success criteria
 */
export interface SuccessCriterion {
  metric: string;
  operator: '<' | '>' | '<=' | '>=' | '==';
  target: number | string;
}

/**
 * Roadmap guardrail
 */
export interface Guardrail {
  metric: string;
  threshold: string;
}

// ========== API Response Types ==========

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

/**
 * API error response
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// ========== Helper Types ==========

/**
 * Type guard for checking if a string is a valid ConsentType
 */
export function isConsentType(value: string): value is ConsentType {
  return ['research_contact', 'usage_analytics', 'email_updates'].includes(value);
}

/**
 * Type guard for checking if a string is a valid ModerationSignal
 */
export function isModerationSignal(value: string): value is ModerationSignal {
  return ['toxicity', 'spam', 'pii', 'off_topic'].includes(value);
}

/**
 * Parse JSON fields safely
 */
export function parseJsonField<T>(field: string, defaultValue: T): T {
  try {
    return JSON.parse(field) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Stringify JSON fields safely
 */
export function stringifyJsonField<T>(value: T): string {
  return JSON.stringify(value);
}

// ========== Constants ==========

/**
 * DSL-defined constants
 */
export const CONSTANTS = {
  FEEDBACK: {
    TITLE_MAX_LENGTH: 120,
    BODY_MAX_LENGTH: 5000,
    EDIT_WINDOW_MINUTES: 15,
    RATE_LIMIT_PER_USER_PER_DAY: 10,
    DEDUPE_THRESHOLD: 0.86,
  },
  VOTING: {
    HALF_LIFE_DAYS: 180,
    DEFAULT_WEIGHT: 1.0,
    PM_WEIGHT_MULTIPLIER: 2.0,
  },
  RESEARCH: {
    SESSION_DEFAULT_DURATION: 45,
    RECORDING_STORAGE_DAYS: 365,
  },
  MODERATION: {
    SLA_HOURS: 48,
    PII_KEEP_LAST_CHARS: 4,
  },
  DATA_RETENTION: {
    FEEDBACK_DAYS: 1825, // 5 years
    RESEARCH_RECORDS_DAYS: 1095, // 3 years
    PII_BACKUPS_DAYS: 30,
  },
} as const;

/**
 * Feedback domain types
 * Based on DSL specification (dsl/global.yaml)
 */

export type FeedbackState = 'new' | 'triaged' | 'merged' | 'in_roadmap' | 'closed';

export type FeedbackVisibility = 'public' | 'internal';

export type FeedbackSource = 'app' | 'web' | 'kiosk' | 'support' | 'import';

export type ModerationStatus = 'auto_pending' | 'pending_review' | 'approved' | 'rejected' | 'needs_info';

export type ModerationSignal = 'toxicity' | 'spam' | 'pii' | 'off_topic';

export type ProductArea = 'Reservations' | 'Check-in' | 'Payments' | 'Housekeeping' | 'Backoffice';

export interface FeedbackAuthor {
  id: string;
  displayName: string;
  email?: string;
  currentVillageId?: string;
}

export interface Feature {
  id: string;
  title: string;
  area: ProductArea;
  tags?: string[];
  status: string;
}

export interface Feedback {
  id: string;
  title: string;
  body: string;
  author: FeedbackAuthor;
  state: FeedbackState;
  visibility: FeedbackVisibility;
  source: FeedbackSource;
  productArea?: ProductArea;
  villageContext?: string;
  featureRefs?: Feature[];
  duplicateOf?: string;
  moderationStatus: ModerationStatus;
  moderationSignals?: ModerationSignal[];
  voteCount: number;
  voteWeight: number;
  createdAt: string;
  updatedAt: string;
  editableUntil: string;
}

export interface FeedbackListItem {
  id: string;
  title: string;
  author: {
    id: string;
    displayName: string;
  };
  state: FeedbackState;
  productArea?: ProductArea;
  voteCount: number;
  voteWeight: number;
  totalWeight?: number; // Alias for voteWeight from API
  userHasVoted?: boolean;
  createdAt: string;
}

export interface FeedbackFilters {
  state?: FeedbackState | 'all';
  productArea?: ProductArea | 'all';
  search?: string;
  page?: number;
  limit?: number;
}

export interface FeedbackListResponse {
  items: FeedbackListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DuplicateSuggestion {
  id: string;
  title: string;
  similarity: number;
  voteCount: number;
  state: FeedbackState;
}

export interface CreateFeedbackInput {
  title: string;
  body: string;
  productArea?: ProductArea;
  featureRefs?: string[];
  featureId?: string | null;
  villageId?: string | null;
  villageContext?: string;
  source?: FeedbackSource;
  visibility?: FeedbackVisibility;
}

export interface UpdateFeedbackInput {
  title?: string;
  body?: string;
}

// Vote types
export interface Vote {
  id: string;
  feedbackId: string;
  userId: string;
  weight: number;
  createdAt: string;
}

export interface VoteResponse {
  success: boolean;
  voteCount: number;
  voteWeight: number;
}

// API Response types for Feedback operations
export interface FeedbackApiResponse {
  success: boolean;
  data?: Feedback;
  error?: string;
  message?: string;
}

export interface MergeFeedbackInput {
  targetId: string;
}

export interface MergeFeedbackResponse {
  success: boolean;
  mergedId: string;
  targetId: string;
  votesMigrated: number;
  message: string;
}

// Rate limiting
export interface RateLimitInfo {
  userId: string;
  count: number;
  windowStart: Date;
  isLimitExceeded: boolean;
}

// Validation errors
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: ValidationError[];
  statusCode: number;
}

/**
 * Type definitions for Questionnaires
 * Based on DSL spec in dsl/global.yaml (lines 153-215)
 */

export enum QuestionType {
  LIKERT_5 = 'likert_5',
  LIKERT_7 = 'likert_7',
  NPS = 'nps',
  MCQ_SINGLE = 'mcq_single',
  MCQ_MULTIPLE = 'mcq_multiple',
  TEXT = 'text',
  RATING = 'rating',
}

export enum QuestionnaireStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
}

export enum TargetingType {
  ALL_USERS = 'all_users',
  SPECIFIC_VILLAGES = 'specific_villages',
  SPECIFIC_PANELS = 'specific_panels',
  BY_ROLE = 'by_role',
}

/**
 * Base question interface
 */
export interface BaseQuestion {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  order: number;
}

/**
 * Likert scale question (5 or 7 point)
 */
export interface LikertQuestion extends BaseQuestion {
  type: QuestionType.LIKERT_5 | QuestionType.LIKERT_7;
  labels?: {
    lowest?: string;
    highest?: string;
  };
}

/**
 * NPS question (0-10 scale)
 */
export interface NPSQuestion extends BaseQuestion {
  type: QuestionType.NPS;
}

/**
 * Multiple choice question (single or multiple selection)
 */
export interface MCQQuestion extends BaseQuestion {
  type: QuestionType.MCQ_SINGLE | QuestionType.MCQ_MULTIPLE;
  options: Array<{
    id: string;
    text: string;
    order: number;
  }>;
}

/**
 * Text question (short or long form)
 */
export interface TextQuestion extends BaseQuestion {
  type: QuestionType.TEXT;
  maxLength?: number;
  multiline?: boolean;
}

/**
 * Rating question (star rating)
 */
export interface RatingQuestion extends BaseQuestion {
  type: QuestionType.RATING;
  maxRating?: number; // Default 5
}

/**
 * Union type for all question types
 */
export type Question =
  | LikertQuestion
  | NPSQuestion
  | MCQQuestion
  | TextQuestion
  | RatingQuestion;

/**
 * Targeting configuration
 */
export interface QuestionnaireTargeting {
  type: TargetingType;
  villageIds?: string[]; // For SPECIFIC_VILLAGES
  panelIds?: string[]; // For SPECIFIC_PANELS
  roles?: string[]; // For BY_ROLE
}

/**
 * Questionnaire interface
 */
export interface Questionnaire {
  id: string;
  title: string;
  version: string;
  questions: Question[];
  targeting: QuestionnaireTargeting;
  status: QuestionnaireStatus;
  anonymous: boolean;
  responseLimit: number; // 1 or unlimited (0)
  startAt?: Date | null;
  endAt?: Date | null;
  maxResponses?: number | null;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response to a single question
 */
export interface QuestionResponse {
  questionId: string;
  type: QuestionType;
  value:
    | number // For Likert, NPS, Rating
    | string // For Text
    | string[] // For MCQ_MULTIPLE
    | string; // For MCQ_SINGLE
}

/**
 * Questionnaire response
 */
export interface QuestionnaireResponse {
  id: string;
  questionnaireId: string;
  respondentId: string;
  answers: Record<string, any>; // Flexible JSON structure
  completedAt: Date;
}

/**
 * Analytics data structures
 */
export interface LikertAnalytics {
  mean: number;
  median: number;
  mode: number;
  distribution: Record<number, number>; // { 1: 5, 2: 10, 3: 15, ... }
  totalResponses: number;
}

export interface NPSAnalytics {
  score: number; // -100 to 100
  promoters: number; // Count
  passives: number; // Count
  detractors: number; // Count
  promotersPercent: number;
  passivesPercent: number;
  detractorsPercent: number;
  totalResponses: number;
}

export interface MCQAnalytics {
  distribution: Record<string, number>; // { optionId: count }
  percentages: Record<string, number>; // { optionId: percentage }
  totalResponses: number;
}

export interface TextAnalytics {
  responses: string[];
  wordFrequency?: Record<string, number>; // Optional word cloud data
  totalResponses: number;
}

export interface RatingAnalytics {
  average: number;
  distribution: Record<number, number>; // { 1: 5, 2: 10, ... }
  totalResponses: number;
}

/**
 * Question-level analytics
 */
export interface QuestionAnalytics {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  data:
    | LikertAnalytics
    | NPSAnalytics
    | MCQAnalytics
    | TextAnalytics
    | RatingAnalytics;
}

/**
 * Demographics breakdown
 */
export interface DemographicsAnalytics {
  byRole: Record<string, number>;
  byVillage: Record<string, number>;
  totalResponses: number;
}

/**
 * Complete analytics for a questionnaire
 */
export interface QuestionnaireAnalytics {
  questionnaireId: string;
  totalResponses: number;
  responsesByDate: Record<string, number>; // { 'YYYY-MM-DD': count }
  lastResponseAt?: Date | null;
  questions: QuestionAnalytics[];
  demographics: DemographicsAnalytics;
}

/**
 * Create questionnaire input
 */
export interface CreateQuestionnaireInput {
  title: string;
  questions: Question[];
  targeting: QuestionnaireTargeting;
  anonymous?: boolean;
  responseLimit?: number;
  startAt?: string | null;
  endAt?: string | null;
  maxResponses?: number | null;
}

/**
 * Update questionnaire input
 */
export interface UpdateQuestionnaireInput {
  title?: string;
  questions?: Question[];
  targeting?: QuestionnaireTargeting;
  anonymous?: boolean;
  responseLimit?: number;
  endAt?: string | null;
  maxResponses?: number | null;
}

/**
 * Submit response input
 */
export interface SubmitResponseInput {
  answers: Record<string, any>;
}

/**
 * Questionnaire list item (with counts)
 */
export interface QuestionnaireListItem extends Questionnaire {
  responseCount: number;
  creator?: {
    id: string;
    displayName?: string | null;
    email: string;
  };
  userHasResponded?: boolean; // For current user
}

/**
 * Questionnaire detail (with full data)
 */
export interface QuestionnaireDetail extends Questionnaire {
  responseCount: number;
  creator?: {
    id: string;
    displayName?: string | null;
    email: string;
    role: string;
  };
  panels?: Array<{
    id: string;
    name: string;
  }>;
}

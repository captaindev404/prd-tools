/**
 * Type definitions for Research Sessions
 * Based on DSL spec in dsl/global.yaml (lines 153-215)
 */

import { SessionType } from '@prisma/client';

export { SessionType };

/**
 * Session status enum
 */
export enum SessionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * Session interface
 */
export interface Session {
  id: string;
  type: SessionType;
  prototypeLink?: string | null;
  scheduledAt: Date;
  durationMinutes: number;
  panelId?: string | null;
  participantIds: string[];
  facilitatorIds: string[];
  minParticipants: number;
  maxParticipants: number;
  consentRequired: boolean;
  recordingEnabled: boolean;
  recordingStorageDays: number;
  notesSecure: boolean;
  notesUri?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Session with panel and user details
 */
export interface SessionDetail extends Session {
  panel?: {
    id: string;
    name: string;
  } | null;
  participants: Array<{
    id: string;
    displayName?: string | null;
    email: string;
    avatarUrl?: string | null;
  }>;
  facilitators: Array<{
    id: string;
    displayName?: string | null;
    email: string;
    avatarUrl?: string | null;
    role: string;
  }>;
}

/**
 * Session list item with counts
 */
export interface SessionListItem extends Session {
  panel?: {
    id: string;
    name: string;
  } | null;
  participantCount: number;
  facilitatorNames: string[];
}

/**
 * Create session input
 */
export interface CreateSessionInput {
  type: SessionType;
  prototypeLink?: string | null;
  scheduledAt: string;
  durationMinutes?: number;
  panelId?: string | null;
  participantIds: string[];
  facilitatorIds: string[];
  minParticipants?: number;
  maxParticipants?: number;
  consentRequired?: boolean;
  recordingEnabled?: boolean;
  recordingStorageDays?: number;
  notesSecure?: boolean;
}

/**
 * Update session input
 */
export interface UpdateSessionInput {
  scheduledAt?: string;
  durationMinutes?: number;
  participantIds?: string[];
  facilitatorIds?: string[];
  status?: string;
  prototypeLink?: string | null;
}

/**
 * Complete session input
 */
export interface CompleteSessionInput {
  notes?: string;
  recordingUrls?: string[];
  insights?: string;
}

/**
 * Session filters for list queries
 */
export interface SessionFilters {
  status?: string;
  panelId?: string;
  startDate?: string;
  endDate?: string;
  participantId?: string;
  facilitatorId?: string;
}

/**
 * Session response for API
 */
export interface SessionResponse {
  id: string;
  type: SessionType;
  prototypeLink?: string | null;
  scheduledAt: string;
  durationMinutes: number;
  panelId?: string | null;
  participantIds: string[];
  facilitatorIds: string[];
  minParticipants: number;
  maxParticipants: number;
  consentRequired: boolean;
  recordingEnabled: boolean;
  recordingStorageDays: number;
  notesSecure: boolean;
  notesUri?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  panel?: {
    id: string;
    name: string;
  } | null;
  participantCount?: number;
  facilitatorNames?: string[];
}

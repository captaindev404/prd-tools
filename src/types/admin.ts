import type { Role } from '@prisma/client';

/**
 * Admin panel type definitions
 */

// User with stats for admin table
export interface UserWithStats {
  id: string;
  email: string;
  displayName: string | null;
  employeeId: string;
  role: Role;
  currentVillageId: string | null;
  currentVillage: {
    id: string;
    name: string;
  } | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    feedbacks: number;
    votes: number;
    questionnaireResponses: number;
    panelMemberships: number;
  };
  lastLogin?: Date | null;
}

// User activity types
export interface FeedbackActivity {
  id: string;
  title: string;
  state: string;
  createdAt: Date;
  voteCount: number;
}

export interface VoteActivity {
  id: string;
  feedbackId: string;
  feedbackTitle: string;
  createdAt: Date;
}

export interface QuestionnaireResponseActivity {
  id: string;
  questionnaireId: string;
  questionnaireTitle: string;
  completedAt: Date;
}

export interface PanelMembershipActivity {
  id: string;
  panelId: string;
  panelName: string;
  joinedAt: Date;
  active: boolean;
}

export interface SessionParticipationActivity {
  id: string;
  type: string;
  scheduledAt: Date;
  status: string;
}

export interface VillageHistoryEntry {
  village_id: string;
  villageName?: string;
  from: string;
  to?: string;
}

export interface ConsentHistoryEntry {
  consent_type: string;
  granted: boolean;
  timestamp: string;
}

export interface UserActivity {
  feedback: FeedbackActivity[];
  votes: VoteActivity[];
  questionnaireResponses: QuestionnaireResponseActivity[];
  panelMemberships: PanelMembershipActivity[];
  sessionParticipations: SessionParticipationActivity[];
  villageHistory: VillageHistoryEntry[];
  consentHistory: ConsentHistoryEntry[];
}

// Village with counts
export interface VillageWithCounts {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    users: number;
  };
}

// Admin dashboard stats
export interface AdminDashboardStats {
  totalUsers: number;
  usersByRole: Record<Role, number>;
  activeUsersLast30Days: number;
  totalVillages: number;
  feedbackStats: {
    total: number;
    today: number;
    thisWeek: number;
  };
  votesStats: {
    total: number;
    today: number;
    thisWeek: number;
  };
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Activity event types
export interface ActivityEvent {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
  metadata?: Record<string, any>;
}

// Update user request
export interface UpdateUserRequest {
  role?: Role;
  currentVillageId?: string;
  consents?: string[];
}

// Create village request
export interface CreateVillageRequest {
  id: string;
  name: string;
}

// Update village request
export interface UpdateVillageRequest {
  id: string;
  name?: string;
}

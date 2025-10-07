/**
 * Audit Logging System
 *
 * Provides comprehensive audit logging for sensitive actions
 * Compliant with GDPR Article 30 (Records of processing activities)
 */

import { prisma } from './prisma';

/**
 * Audit event types
 */
export enum AuditAction {
  // Authentication & Access
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_LOGIN_FAILED = 'user.login_failed',

  // Account Management
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_ANONYMIZED = 'user.anonymized',
  USER_ROLE_CHANGED = 'user.role_changed',

  // Data Access
  DATA_EXPORTED = 'data.exported',
  DATA_VIEWED = 'data.viewed',
  SENSITIVE_DATA_ACCESSED = 'data.sensitive_accessed',

  // Consent Management
  CONSENT_GRANTED = 'consent.granted',
  CONSENT_REVOKED = 'consent.revoked',
  CONSENT_UPDATED = 'consent.updated',

  // Research Sessions
  SESSION_CREATED = 'session.created',
  SESSION_STARTED = 'session.started',
  SESSION_COMPLETED = 'session.completed',
  SESSION_DELETED = 'session.deleted',
  SESSION_NOTES_ACCESSED = 'session.notes_accessed',
  SESSION_RECORDING_ACCESSED = 'session.recording_accessed',

  // Panel Management
  PANEL_CREATED = 'panel.created',
  PANEL_DELETED = 'panel.deleted',
  PANEL_MEMBER_ADDED = 'panel.member_added',
  PANEL_MEMBER_REMOVED = 'panel.member_removed',

  // Questionnaires
  QUESTIONNAIRE_CREATED = 'questionnaire.created',
  QUESTIONNAIRE_PUBLISHED = 'questionnaire.published',
  QUESTIONNAIRE_DELETED = 'questionnaire.deleted',
  QUESTIONNAIRE_RESPONSE_EXPORTED = 'questionnaire.response_exported',

  // Moderation
  CONTENT_MODERATED = 'content.moderated',
  CONTENT_DELETED = 'content.deleted',
  USER_BANNED = 'user.banned',

  // Admin Actions
  ADMIN_ACCESS = 'admin.access',
  ADMIN_SETTINGS_CHANGED = 'admin.settings_changed',
  ADMIN_USER_IMPERSONATION = 'admin.user_impersonation',
}

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  action: AuditAction | string;
  actorId: string;
  actorEmail?: string;
  actorRole?: string;
  targetUserId?: string | null;
  targetResourceType?: string | null;
  targetResourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any>;
  success: boolean;
  errorMessage?: string | null;
}

/**
 * Extract IP address from request
 */
export function getIpAddress(request: Request): string | null {
  // Check X-Forwarded-For (proxy/load balancer)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0];
    return firstIp ? firstIp.trim() : null;
  }

  // Check X-Real-IP
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return null;
}

/**
 * Extract User-Agent from request
 */
export function getUserAgent(request: Request): string | null {
  return request.headers.get('user-agent');
}

/**
 * Create audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    // Store in dedicated AuditLog table
    await prisma.auditLog.create({
      data: {
        userId: entry.actorId,
        action: entry.action,
        resourceId: entry.targetResourceId || null,
        resourceType: entry.targetResourceType || null,
        metadata: JSON.stringify({
          actorEmail: entry.actorEmail,
          actorRole: entry.actorRole,
          targetUserId: entry.targetUserId,
          metadata: entry.metadata,
          success: entry.success,
          errorMessage: entry.errorMessage,
        }),
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
      },
    });

    // Also create Event for event-driven pipeline
    await prisma.event.create({
      data: {
        type: entry.action,
        userId: entry.actorId,
        payload: JSON.stringify({
          actorEmail: entry.actorEmail,
          actorRole: entry.actorRole,
          targetUserId: entry.targetUserId,
          targetResourceType: entry.targetResourceType,
          targetResourceId: entry.targetResourceId,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          metadata: entry.metadata,
          success: entry.success,
          errorMessage: entry.errorMessage,
          timestamp: new Date().toISOString(),
        }),
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break application flow
  }
}

/**
 * Log authentication attempt
 */
export async function logAuthAttempt(
  email: string,
  success: boolean,
  userId?: string,
  request?: Request,
  errorMessage?: string
): Promise<void> {
  await createAuditLog({
    action: success ? AuditAction.USER_LOGIN : AuditAction.USER_LOGIN_FAILED,
    actorId: userId || 'anonymous',
    actorEmail: email,
    ipAddress: request ? getIpAddress(request) : null,
    userAgent: request ? getUserAgent(request) : null,
    success,
    errorMessage,
  });
}

/**
 * Log data export
 */
export async function logDataExport(
  userId: string,
  email: string,
  role: string,
  exportType: 'full' | 'partial',
  dataSize: number,
  request?: Request
): Promise<void> {
  await createAuditLog({
    action: AuditAction.DATA_EXPORTED,
    actorId: userId,
    actorEmail: email,
    actorRole: role,
    ipAddress: request ? getIpAddress(request) : null,
    userAgent: request ? getUserAgent(request) : null,
    metadata: {
      exportType,
      dataSizeBytes: dataSize,
    },
    success: true,
  });
}

/**
 * Log account deletion/anonymization
 */
export async function logAccountDeletion(
  userId: string,
  email: string,
  mode: 'delete' | 'anonymize',
  reason?: string,
  request?: Request
): Promise<void> {
  await createAuditLog({
    action: mode === 'delete' ? AuditAction.USER_DELETED : AuditAction.USER_ANONYMIZED,
    actorId: userId,
    actorEmail: email,
    ipAddress: request ? getIpAddress(request) : null,
    userAgent: request ? getUserAgent(request) : null,
    metadata: {
      mode,
      reason,
    },
    success: true,
  });
}

/**
 * Log sensitive data access
 */
export async function logSensitiveDataAccess(
  userId: string,
  email: string,
  role: string,
  resourceType: string,
  resourceId: string,
  action: string,
  request?: Request
): Promise<void> {
  await createAuditLog({
    action: AuditAction.SENSITIVE_DATA_ACCESSED,
    actorId: userId,
    actorEmail: email,
    actorRole: role,
    targetResourceType: resourceType,
    targetResourceId: resourceId,
    ipAddress: request ? getIpAddress(request) : null,
    userAgent: request ? getUserAgent(request) : null,
    metadata: {
      dataAccessAction: action,
    },
    success: true,
  });
}

/**
 * Log role change
 */
export async function logRoleChange(
  actorId: string,
  actorEmail: string,
  actorRole: string,
  targetUserId: string,
  oldRole: string,
  newRole: string,
  request?: Request
): Promise<void> {
  await createAuditLog({
    action: AuditAction.USER_ROLE_CHANGED,
    actorId,
    actorEmail,
    actorRole,
    targetUserId,
    ipAddress: request ? getIpAddress(request) : null,
    userAgent: request ? getUserAgent(request) : null,
    metadata: {
      oldRole,
      newRole,
    },
    success: true,
  });
}

/**
 * Log admin action
 */
export async function logAdminAction(
  adminId: string,
  adminEmail: string,
  action: string,
  targetResource?: { type: string; id: string },
  metadata?: Record<string, any>,
  request?: Request
): Promise<void> {
  await createAuditLog({
    action: AuditAction.ADMIN_ACCESS,
    actorId: adminId,
    actorEmail: adminEmail,
    actorRole: 'ADMIN',
    targetResourceType: targetResource?.type,
    targetResourceId: targetResource?.id,
    ipAddress: request ? getIpAddress(request) : null,
    userAgent: request ? getUserAgent(request) : null,
    metadata: {
      adminAction: action,
      ...metadata,
    },
    success: true,
  });
}

/**
 * Log moderation action
 */
export async function logModerationAction(
  moderatorId: string,
  moderatorEmail: string,
  action: 'approve' | 'reject' | 'delete',
  contentType: string,
  contentId: string,
  reason?: string,
  request?: Request
): Promise<void> {
  await createAuditLog({
    action: AuditAction.CONTENT_MODERATED,
    actorId: moderatorId,
    actorEmail: moderatorEmail,
    actorRole: 'MODERATOR',
    targetResourceType: contentType,
    targetResourceId: contentId,
    ipAddress: request ? getIpAddress(request) : null,
    userAgent: request ? getUserAgent(request) : null,
    metadata: {
      moderationAction: action,
      reason,
    },
    success: true,
  });
}

/**
 * Get audit logs for a user (admin only)
 */
export async function getUserAuditLogs(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    actions?: AuditAction[];
  } = {}
): Promise<{ logs: any[]; total: number }> {
  const { limit = 50, offset = 0, startDate, endDate, actions } = options;

  const where: any = {
    userId,
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  if (actions && actions.length > 0) {
    where.action = {
      in: actions,
    };
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        action: true,
        resourceId: true,
        resourceType: true,
        metadata: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs: logs.map((log) => ({
      ...log,
      metadata: JSON.parse(log.metadata),
    })),
    total,
  };
}

/**
 * Get all audit logs (admin only)
 */
export async function getAllAuditLogs(options: {
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
  action?: string;
  resourceType?: string;
} = {}): Promise<{ logs: any[]; total: number }> {
  const { limit = 100, offset = 0, startDate, endDate, action, resourceType } = options;

  const where: any = {};

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  if (action) {
    where.action = action;
  }

  if (resourceType) {
    where.resourceType = resourceType;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs: logs.map((log) => ({
      ...log,
      metadata: JSON.parse(log.metadata),
    })),
    total,
  };
}

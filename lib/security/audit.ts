// Audit Logging Service for Enterprise Security
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';

const prisma = new PrismaClient();

// Action types for audit logging
export type AuditAction = 
  | 'login'
  | 'logout'
  | 'view_dashboard'
  | 'view_analytics'
  | 'view_transactions'
  | 'export_data'
  | 'create_user'
  | 'update_user'
  | 'delete_user'
  | 'update_settings'
  | 'api_access'
  | 'failed_login'
  | 'password_change'
  | 'role_change';

// Resource types
export type AuditResource = 
  | 'dashboard'
  | 'analytics'
  | 'transactions'
  | 'users'
  | 'settings'
  | 'forecasting'
  | 'reports'
  | 'api';

export interface AuditLogInput {
  userId?: string;
  merchantId?: string;
  action: AuditAction;
  resource?: AuditResource;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event to the database
 */
export async function logAuditEvent(input: AuditLogInput): Promise<void> {
  try {
    // Get request headers for IP and user agent if not provided
    let ipAddress = input.ipAddress;
    let userAgent = input.userAgent;
    
    if (!ipAddress || !userAgent) {
      try {
        const headersList = await headers();
        ipAddress = ipAddress || headersList.get('x-forwarded-for')?.split(',')[0] || 
                    headersList.get('x-real-ip') || 
                    'unknown';
        userAgent = userAgent || headersList.get('user-agent') || 'unknown';
      } catch {
        // Headers not available (e.g., in non-request context)
        ipAddress = ipAddress || 'system';
        userAgent = userAgent || 'system';
      }
    }

    await prisma.audit_logs.create({
      data: {
        user_id: input.userId,
        merchant_id: input.merchantId,
        action: input.action,
        resource: input.resource,
        resource_id: input.resourceId,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
      },
    });
  } catch (error) {
    // Don't throw - audit logging should not break the main flow
    console.error('[AUDIT] Failed to log event:', error);
  }
}

/**
 * Query audit logs with filters
 */
export async function getAuditLogs(filters: {
  userId?: string;
  merchantId?: string;
  action?: AuditAction;
  resource?: AuditResource;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: Record<string, unknown> = {};
  
  if (filters.userId) where.user_id = filters.userId;
  if (filters.merchantId) where.merchant_id = filters.merchantId;
  if (filters.action) where.action = filters.action;
  if (filters.resource) where.resource = filters.resource;
  
  if (filters.startDate || filters.endDate) {
    where.created_at = {};
    if (filters.startDate) (where.created_at as Record<string, Date>).gte = filters.startDate;
    if (filters.endDate) (where.created_at as Record<string, Date>).lte = filters.endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.audit_logs.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        merchant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.audit_logs.count({ where }),
  ]);

  return { logs, total };
}

/**
 * Get recent activity for a user
 */
export async function getUserActivity(userId: string, limit: number = 10) {
  return prisma.audit_logs.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    take: limit,
  });
}

/**
 * Get security events (failed logins, etc.)
 */
export async function getSecurityEvents(merchantId?: string, limit: number = 50) {
  const securityActions: AuditAction[] = ['failed_login', 'password_change', 'role_change'];
  
  return prisma.audit_logs.findMany({
    where: {
      action: { in: securityActions },
      ...(merchantId && { merchant_id: merchantId }),
    },
    orderBy: { created_at: 'desc' },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Helper to create audit log with session info
 */
export function createAuditLogger(userId: string, merchantId?: string) {
  return {
    log: (action: AuditAction, resource?: AuditResource, resourceId?: string, metadata?: Record<string, unknown>) => 
      logAuditEvent({ userId, merchantId, action, resource, resourceId, metadata }),
    
    logDashboardView: () => 
      logAuditEvent({ userId, merchantId, action: 'view_dashboard', resource: 'dashboard' }),
    
    logAnalyticsView: () => 
      logAuditEvent({ userId, merchantId, action: 'view_analytics', resource: 'analytics' }),
    
    logTransactionsView: () => 
      logAuditEvent({ userId, merchantId, action: 'view_transactions', resource: 'transactions' }),
    
    logDataExport: (resource: AuditResource, metadata?: Record<string, unknown>) => 
      logAuditEvent({ userId, merchantId, action: 'export_data', resource, metadata }),
    
    logApiAccess: (endpoint: string, method: string) => 
      logAuditEvent({ userId, merchantId, action: 'api_access', resource: 'api', metadata: { endpoint, method } }),
  };
}

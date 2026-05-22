/**
 * Audit visibility helpers.
 * Admin-only, RBAC-safe summaries of security-relevant audit events.
 *
 * Complements the full AuditService by offering pre-filtered operational views
 * without requiring the caller to compose complex queries.
 *
 * All functions are defensive — they return empty/zero results on DB error
 * rather than propagating exceptions to the caller.
 */

import { Types } from 'mongoose';
import { AuditLog, IAuditLog } from '../../models/auditLog';
import { AuditCategory, AuditSeverity } from '../../models/auditLogEnums';
import { logger } from '../../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthFailureSummary {
  recentFailures: Array<{
    actorIp?: string;
    actorEmail?: string;
    action: string;
    createdAt: Date;
  }>;
  totalIn24h: number;
  uniqueIpsIn24h: number;
}

export interface SecurityEventSummaryDB {
  highSeverityIn24h: number;
  criticalIn24h: number;
  forbiddenAccessIn24h: number;
  recentHighSeverity: Array<{
    action: string;
    entityType: string;
    severity: string;
    createdAt: Date;
    actorIp?: string;
  }>;
}

export interface PermissionDenialSummary {
  totalIn24h: number;
  byRole: Record<string, number>;
  recentDenials: Array<{
    actorRole?: string;
    actorIp?: string;
    entityType: string;
    action: string;
    createdAt: Date;
  }>;
}

export interface AdminActivityEntry {
  action: string;
  entityType: string;
  actorUserId?: Types.ObjectId;
  createdAt: Date;
}

// ─── Lean document type ───────────────────────────────────────────────────────
// IAuditLog + mongoose timestamps exposed by .lean()

type LeanAuditLog = IAuditLog & {
  _id: Types.ObjectId;
  createdAt: Date;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function since24h(): Date {
  return new Date(Date.now() - 24 * 60 * 60 * 1000);
}

// ─── Auth Failure Summary ─────────────────────────────────────────────────────

/**
 * Summary of recent high-severity authentication failures in the last 24 hours.
 * Used by the admin diagnostics dashboard to surface brute-force attempts.
 */
export async function getAuthFailureSummary(): Promise<AuthFailureSummary> {
  try {
    const since = since24h();

    const [failures, total] = await Promise.all([
      AuditLog.find({
        category: AuditCategory.Auth,
        severity: { $in: [AuditSeverity.Error, AuditSeverity.Critical] },
        createdAt: { $gte: since },
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('actorIp metadata action createdAt')
        .lean<LeanAuditLog[]>(),

      AuditLog.countDocuments({
        category: AuditCategory.Auth,
        severity: { $in: [AuditSeverity.Error, AuditSeverity.Critical] },
        createdAt: { $gte: since },
      }),
    ]);

    const uniqueIps = new Set<string>();

    const recentFailures = failures.map((f) => {
      if (f.actorIp) uniqueIps.add(f.actorIp);
      const meta = f.metadata as Record<string, unknown> | undefined;
      return {
        actorIp: f.actorIp,
        actorEmail: meta?.['email'] as string | undefined,
        action: String(f.action),
        createdAt: f.createdAt,
      };
    });

    return { recentFailures, totalIn24h: total, uniqueIpsIn24h: uniqueIps.size };
  } catch (err) {
    logger.error('[AuditVisibility] getAuthFailureSummary failed', { err });
    return { recentFailures: [], totalIn24h: 0, uniqueIpsIn24h: 0 };
  }
}

// ─── Security Event Summary ───────────────────────────────────────────────────

/**
 * Count and preview high/critical severity events from the last 24 hours.
 */
export async function getSecurityEventSummaryDB(): Promise<SecurityEventSummaryDB> {
  try {
    const since = since24h();

    const [highCount, criticalCount, forbiddenCount, recentHigh] = await Promise.all([
      AuditLog.countDocuments({ severity: AuditSeverity.Error, createdAt: { $gte: since } }),
      AuditLog.countDocuments({ severity: AuditSeverity.Critical, createdAt: { $gte: since } }),
      AuditLog.countDocuments({
        action: { $regex: /forbidden|denied|unauthorized/i },
        createdAt: { $gte: since },
      }),
      AuditLog.find({
        severity: { $in: [AuditSeverity.Error, AuditSeverity.Critical] },
        createdAt: { $gte: since },
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('action entityType severity createdAt actorIp')
        .lean<LeanAuditLog[]>(),
    ]);

    return {
      highSeverityIn24h: highCount,
      criticalIn24h: criticalCount,
      forbiddenAccessIn24h: forbiddenCount,
      recentHighSeverity: recentHigh.map((e) => ({
        action: String(e.action),
        entityType: String(e.entityType),
        severity: String(e.severity),
        createdAt: e.createdAt,
        actorIp: e.actorIp,
      })),
    };
  } catch (err) {
    logger.error('[AuditVisibility] getSecurityEventSummaryDB failed', { err });
    return { highSeverityIn24h: 0, criticalIn24h: 0, forbiddenAccessIn24h: 0, recentHighSeverity: [] };
  }
}

// ─── Permission Denial Summary ────────────────────────────────────────────────

/**
 * Summary of RBAC/permission denial events in the last 24 hours.
 */
export async function getPermissionDenialSummary(): Promise<PermissionDenialSummary> {
  try {
    const since = since24h();

    const denials = await AuditLog.find({
      action: { $regex: /forbidden|denied|unauthorized|permission/i },
      createdAt: { $gte: since },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('actorRole actorIp entityType action createdAt')
      .lean<LeanAuditLog[]>();

    const byRole: Record<string, number> = {};

    const recentDenials = denials.slice(0, 10).map((d) => {
      if (d.actorRole) byRole[d.actorRole] = (byRole[d.actorRole] ?? 0) + 1;
      return {
        actorRole: d.actorRole,
        actorIp: d.actorIp,
        entityType: String(d.entityType),
        action: String(d.action),
        createdAt: d.createdAt,
      };
    });

    return { totalIn24h: denials.length, byRole, recentDenials };
  } catch (err) {
    logger.error('[AuditVisibility] getPermissionDenialSummary failed', { err });
    return { totalIn24h: 0, byRole: {}, recentDenials: [] };
  }
}

// ─── Recent Admin Activity ────────────────────────────────────────────────────

/**
 * Most recent admin-role actions — for internal operational oversight.
 */
export async function getRecentAdminActivity(limit = 20): Promise<AdminActivityEntry[]> {
  try {
    const docs = await AuditLog.find({ actorRole: 'admin' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('action entityType actorUserId createdAt')
      .lean<LeanAuditLog[]>();

    return docs.map((d) => ({
      action: String(d.action),
      entityType: String(d.entityType),
      actorUserId: d.actorUserId as Types.ObjectId | undefined,
      createdAt: d.createdAt,
    }));
  } catch (err) {
    logger.error('[AuditVisibility] getRecentAdminActivity failed', { err });
    return [];
  }
}

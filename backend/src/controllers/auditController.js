import { db } from "../prisma/db.js";

// ── DEVELOPER / INTERNAL SUPER_ADMIN accounts to hide from college-facing UI ─
// These are developer/internal accounts that should NOT appear in college audit logs.
// Accounts are identified by email. DO NOT delete these accounts from the DB —
// only filter them from the college-facing listing.
const INTERNAL_ACCOUNT_EMAILS = [
  // Add developer account emails here if applicable
  // e.g., 'dev@smartattend.internal'
];

/**
 * GET /api/admin/audit-logs
 *
 * Returns audit log entries for the college-facing UI.
 *
 * SECURITY:
 *   - SUPER_ADMIN sees all logs (minus developer-internal accounts)
 *   - ADMIN/HOD sees only logs for their departmentId
 *   - Developer/internal SUPER_ADMIN accounts are filtered from results
 *   - Audit records for internal accounts are preserved in DB, just hidden from UI
 */
export const getAuditLogs = async (req, res) => {
  try {
    const { role, departmentId } = req.user;

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));

    const { entityType, action, startDate, endDate } = req.query;

    let logs = [];
    let users = [];
    try {
      logs = (await db.orm.public.AuditLog.all()) || [];
      users = (await db.orm.public.User.all()) || [];
    } catch {
      logs = [];
      users = [];
    }

    // ── Filter out internal/developer SUPER_ADMIN accounts ───────────────────
    const internalUserIds = users
      .filter((u) =>
        INTERNAL_ACCOUNT_EMAILS.includes(u.email?.toLowerCase())
      )
      .map((u) => u.id);

    logs = logs.filter((log) => !internalUserIds.includes(log.userId));

    // ── Department scope enforcement for HOD/ADMIN ─────────────────────────
    if (role !== "SUPER_ADMIN" && departmentId) {
      logs = logs.filter(
        (log) => log.departmentId === null || log.departmentId === departmentId
      );
    }

    // ── Additional filters ──────────────────────────────────────────────────
    if (entityType) {
      logs = logs.filter(
        (log) => log.entityType?.toLowerCase() === String(entityType).toLowerCase()
      );
    }

    if (action) {
      logs = logs.filter(
        (log) => log.action?.toLowerCase() === String(action).toLowerCase()
      );
    }

    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start)) {
        logs = logs.filter((log) => new Date(log.createdAt) >= start);
      }
    }

    if (endDate) {
      const end = new Date(endDate);
      if (!isNaN(end)) {
        end.setHours(23, 59, 59, 999);
        logs = logs.filter((log) => new Date(log.createdAt) <= end);
      }
    }

    // ── Sort by most recent ─────────────────────────────────────────────────
    logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = logs.length;
    const offset = (page - 1) * limit;
    const paginatedLogs = logs.slice(offset, offset + limit);

    // ── Enrich with user info ───────────────────────────────────────────────
    const enriched = paginatedLogs.map((log) => {
      const user = users.find((u) => u.id === log.userId);
      return {
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId ?? null,
        departmentId: log.departmentId ?? null,
        details: log.details ? (() => {
          try { return JSON.parse(log.details); } catch { return log.details; }
        })() : null,
        ipAddress: log.ipAddress ?? null,
        createdAt: log.createdAt,
        performedBy: user
          ? {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
            }
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Audit log error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
    });
  }
};

/**
 * Helper: create an audit log entry (called from other controllers)
 *
 * Does not throw — audit logging is non-blocking for the main operation.
 */
export const createAuditLog = async ({
  userId,
  action,
  entityType,
  entityId = null,
  departmentId = null,
  details = null,
  ipAddress = null,
}) => {
  try {
    await db.orm.public.AuditLog.create({
      userId,
      action,
      entityType,
      entityId,
      departmentId,
      details: details ? JSON.stringify(details) : null,
      ipAddress,
    });
  } catch (err) {
    console.warn("Audit log write failed (non-blocking):", err?.message);
  }
};

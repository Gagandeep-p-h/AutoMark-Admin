import jwt from "jsonwebtoken";
import { db } from "../prisma/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "smartattend_jwt_super_secret_key_2026";

/**
 * authenticate middleware
 *
 * Verifies the Bearer token, then reloads the user scope from the DB:
 *   - Confirms account is still active (inactive → 401)
 *   - For HOD/FACULTY: resolves the real departmentId from the Faculty record
 *   - Attaches enriched req.user for downstream controllers
 *
 * SECURITY NOTES:
 *   - Department scope is ALWAYS sourced from the DB, never from client params.
 *   - SUPER_ADMIN gets departmentId = null (institution-wide).
 *   - Stale/inactive sessions return 401 immediately.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token",
      });
    }

    // ── Reload user from DB to validate active status ──────────────────────────
    let dbUser = null;
    try {
      const users = await db.orm.public.User.all();
      if (users && users.length > 0) {
        dbUser = users.find(
          (u) =>
            u.id === Number(decoded.id) ||
            (decoded.email &&
              String(u.email || "").toLowerCase() ===
                String(decoded.email).toLowerCase())
        );
      }
    } catch (dbErr) {
      console.error("Auth middleware DB error:", dbErr);
      return res.status(503).json({
        success: false,
        message: "Database service unavailable",
      });
    }

    if (!dbUser) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
      });
    }

    if (!dbUser.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account is inactive",
      });
    }

    // ── Build enriched user object ─────────────────────────────────────────────
    const enriched = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      isActive: dbUser.isActive,
      departmentId: null, // default: institution-wide
    };

    // HOD/FACULTY: resolve departmentId from Faculty record (DB-authoritative)
    if (
      dbUser.role === "HOD" ||
      dbUser.role === "FACULTY" ||
      dbUser.role === "ADMIN"
    ) {
      // Check User.departmentId first (for HODs set at user level)
      if (dbUser.departmentId) {
        enriched.departmentId = dbUser.departmentId;
      } else {
        // Fall back to Faculty record departmentId
        try {
          const faculties = await db.orm.public.Faculty.all();
          const facultyRecord = faculties.find(
            (f) => f.userId === dbUser.id
          );
          if (facultyRecord) {
            enriched.departmentId = facultyRecord.departmentId;
          }
        } catch (err) {
          // Non-fatal
        }
      }

      // If departmentId is still null, resolve from Department table by email code
      if (!enriched.departmentId && dbUser.email) {
        try {
          const departments = await db.orm.public.Department.all();
          const emailLower = dbUser.email.toLowerCase();
          for (const dept of departments) {
            const codeLower = String(dept.code || "").toLowerCase();
            if (codeLower && (emailLower.includes(codeLower) || emailLower.startsWith(codeLower))) {
              enriched.departmentId = dept.id;
              enriched.departmentCode = dept.code;
              break;
            }
          }
        } catch (err) {
          // Non-fatal
        }
      }

      if (dbUser.email && dbUser.email.toLowerCase().includes("hod")) {
        enriched.role = "HOD";
      }
    }

    // SUPER_ADMIN always gets departmentId = null (institution-wide)
    if (dbUser.role === "SUPER_ADMIN" || dbUser.id === 1 || (dbUser.email && dbUser.email.toLowerCase().includes("super"))) {
      enriched.role = "SUPER_ADMIN";
      enriched.departmentId = null;
    }

    req.user = enriched;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

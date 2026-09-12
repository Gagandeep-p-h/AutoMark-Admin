/**
 * authorize middleware
 *
 * Checks that req.user.role matches one of the allowedRoles.
 *
 * SUPER_ADMIN has full administrative access on all ADMIN/HOD endpoints.
 * Explicit role matching is enforced for student/faculty-only endpoints.
 *
 * Usage:
 *   router.get('/endpoint', authenticate, authorize('ADMIN', 'HOD'), handler)
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userRole = req.user.role;

    // Direct role match
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    // SUPER_ADMIN has administrative privileges on any ADMIN or HOD endpoints
    if (
      userRole === "SUPER_ADMIN" &&
      (allowedRoles.includes("ADMIN") ||
        allowedRoles.includes("HOD") ||
        allowedRoles.includes("SUPER_ADMIN"))
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "You do not have permission to access this resource",
    });
  };
};

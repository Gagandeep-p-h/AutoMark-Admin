import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "smartattend_jwt_super_secret_key_2026";

/**
 * generateToken — creates a signed JWT for a user.
 *
 * Includes departmentId so HOD scope is carried without extra DB lookups
 * on every request. The auth middleware always re-validates isActive from DB.
 *
 * @param {object} user - DB User record
 * @param {number|null} [departmentId] - Department scope for HOD/FACULTY (null = institution-wide)
 */
export const generateToken = (user, departmentId = null) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      departmentId: departmentId ?? null,
    },
    JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
};

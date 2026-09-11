/**
 * Centralized HOD Department Mapping Helper
 * 
 * TEMPORARY IMPLEMENTATION:
 * Department identification for HODs is resolved based on the HOD login email.
 * 
 * NOTE FOR LOGIN/AUTH TEAM:
 * When authenticated user and department data are fully integrated into JWT / session,
 * replace the body of `getHodDepartment()` to retrieve `authenticatedUser.departmentId`
 * or `authenticatedUser.department` directly.
 */

export const HOD_DEPARTMENT_MAP = {
  'csehod@klsvdit.edu.in': 'CSE',
  'aimlhod@klsvdit.edu.in': 'AIML',
  'ecehod@klsvdit.edu.in': 'ECE',
  'eeehod@klsvdit.edu.in': 'EEE',
  'mechhod@klsvdit.edu.in': 'MECH',
  'civilhod@klsvdit.edu.in': 'CIVIL',
  'cse-dshod@klsvdit.edu.in': 'CSE-DS',
};

/**
 * Resolves the department code for an HOD from their email address.
 * 
 * @param {string | null | undefined} email - The user's email address
 * @returns {string | null} The department code (e.g., 'CSE', 'AIML') or null if user is not an HOD
 */
export function getHodDepartment(email) {
  if (!email) return null;
  const normalizedEmail = String(email).trim().toLowerCase();
  return HOD_DEPARTMENT_MAP[normalizedEmail] || null;
}

/**
 * Checks if a given email belongs to an HOD
 * 
 * @param {string | null | undefined} email
 * @returns {boolean}
 */
export function isHodUser(email) {
  return Boolean(getHodDepartment(email));
}

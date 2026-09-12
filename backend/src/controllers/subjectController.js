import { db } from "../prisma/db.js";

/**
 * GET /api/subjects
 * Fetches subjects directly from PostgreSQL database.
 * Optional query: ?departmentId=...
 */
export const getSubjects = async (req, res) => {
  try {
    const { departmentId } = req.query;
    let subjects = await db.orm.public.Subject.all();

    if (departmentId) {
      subjects = subjects.filter((s) => Number(s.departmentId) === Number(departmentId));
    }

    return res.status(200).json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    console.error("Error fetching subjects from database:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch subjects from database",
      error: error.message,
    });
  }
};

/**
 * POST /api/subjects
 * Creates a new subject directly in PostgreSQL database.
 * Payload: { name, code, credits, departmentId }
 */
export const createSubject = async (req, res) => {
  try {
    const { name, code, credits, departmentId } = req.body;

    // 1. Validate required fields
    if (!name || !code || credits === undefined || credits === null) {
      return res.status(400).json({
        success: false,
        message: "Subject code, name, and credits are required",
      });
    }

    // 2. Validate departmentId - no hardcoded default allowed
    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: "Department is required to create a subject.",
      });
    }

    const deptId = Number(departmentId);
    if (isNaN(deptId) || deptId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid department ID provided.",
      });
    }

    // 3. Validate credits as valid positive integer
    const numCredits = Number(credits);
    if (isNaN(numCredits) || !Number.isInteger(numCredits) || numCredits < 1 || numCredits > 10) {
      return res.status(400).json({
        success: false,
        message: "Credits must be a valid integer between 1 and 10.",
      });
    }

    const trimmedCode = String(code).trim().toUpperCase();
    const trimmedName = String(name).trim();

    if (!trimmedCode) {
      return res.status(400).json({
        success: false,
        message: "Subject code cannot be empty.",
      });
    }

    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: "Subject name cannot be empty.",
      });
    }

    // 4. Verify department exists in PostgreSQL
    const departments = await db.orm.public.Department.all();
    const deptExists = departments.some((d) => Number(d.id) === deptId);
    if (!deptExists) {
      return res.status(400).json({
        success: false,
        message: `Department with ID ${deptId} does not exist.`,
      });
    }

    // 5. Check duplicate subject code in PostgreSQL
    const existingSubjects = await db.orm.public.Subject.all();
    if (existingSubjects.some((s) => s.code.toUpperCase() === trimmedCode)) {
      return res.status(409).json({
        success: false,
        message: `Subject code ${trimmedCode} already exists.`,
      });
    }

    // 6. Persist directly to PostgreSQL Subject model
    const subject = await db.orm.public.Subject.create({
      name: trimmedName,
      code: trimmedCode,
      departmentId: deptId,
      credits: numCredits,
    });

    return res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: subject,
    });
  } catch (error) {
    console.error("Error creating subject in database:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create subject because the database is unavailable.",
      error: error.message,
    });
  }
};

/**
 * PUT /api/subjects/:id
 * Updates an existing subject in PostgreSQL database.
 */
export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, credits, departmentId } = req.body;

    if (!name || !code || credits === undefined || credits === null) {
      return res.status(400).json({
        success: false,
        message: "Subject code, name, and credits are required",
      });
    }

    const trimmedCode = String(code).trim().toUpperCase();
    const trimmedName = String(name).trim();
    const numCredits = Number(credits);

    if (!trimmedCode) {
      return res.status(400).json({
        success: false,
        message: "Subject code cannot be empty.",
      });
    }

    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: "Subject name cannot be empty.",
      });
    }

    if (isNaN(numCredits) || !Number.isInteger(numCredits) || numCredits < 1 || numCredits > 10) {
      return res.status(400).json({
        success: false,
        message: "Credits must be a valid integer between 1 and 10.",
      });
    }

    // Check existing subject in PostgreSQL
    const allSubjects = await db.orm.public.Subject.all();
    const existing = allSubjects.find((s) => String(s.id) === String(id));
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // Check duplicate code (excluding current record)
    const duplicate = allSubjects.find(
      (s) => s.code.toUpperCase() === trimmedCode && String(s.id) !== String(id)
    );
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `Subject code ${trimmedCode} already exists.`,
      });
    }

    let deptIdToSet = existing.departmentId;
    if (departmentId) {
      const deptId = Number(departmentId);
      const departments = await db.orm.public.Department.all();
      const deptExists = departments.some((d) => Number(d.id) === deptId);
      if (!deptExists) {
        return res.status(400).json({
          success: false,
          message: `Department with ID ${deptId} does not exist.`,
        });
      }
      deptIdToSet = deptId;
    }

    // Update in PostgreSQL
    const updated = await db.orm.public.Subject.update(
      { id: Number(id) },
      {
        name: trimmedName,
        code: trimmedCode,
        credits: numCredits,
        departmentId: deptIdToSet,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating subject in database:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update subject because the database is unavailable.",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/subjects/:id
 * Deletes a subject from PostgreSQL database after verifying relationship safety.
 */
export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    const allSubjects = await db.orm.public.Subject.all();
    const existing = allSubjects.find((s) => String(s.id) === String(id));
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // Check whether the subject is currently referenced by any Class (Class.subjectId -> Subject.id)
    try {
      const classes = await db.orm.public.Class.all();
      const isAssociatedWithClass = classes.some((c) => Number(c.subjectId) === Number(id));
      if (isAssociatedWithClass) {
        return res.status(409).json({
          success: false,
          message: "This subject cannot be deleted because it is currently associated with an existing class.",
        });
      }
    } catch (relErr) {
      console.warn("Could not check class relationships before subject delete:", relErr);
    }

    // Delete directly from PostgreSQL
    await db.orm.public.Subject.delete({ id: Number(id) });

    return res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting subject from database:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to delete subject because the database is unavailable.",
      error: error.message,
    });
  }
};

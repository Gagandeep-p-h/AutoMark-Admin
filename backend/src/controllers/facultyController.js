import { db } from "../prisma/db.js";
import bcrypt from "bcryptjs";

export const getFaculty = async (req, res) => {
  try {
    const faculty = await db.orm.public.Faculty.all();

    res.status(200).json({
      success: true,
      data: faculty,
    });
  } catch (error) {
    console.error("Error fetching faculty:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch faculty",
    });
  }
};

export const createFaculty = async (req, res) => {
  try {
    const { name, email, password, employeeId, departmentId } = req.body;

    if (!name || !email || !password || !employeeId || !departmentId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check email
    const users = await db.orm.public.User.all();

    if (users.some((user) => user.email === email)) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Check employee ID
    const existingFaculty = await db.orm.public.Faculty.all();

    if (existingFaculty.some((faculty) => faculty.employeeId === employeeId)) {
      return res.status(409).json({
        success: false,
        message: "Employee ID already exists",
      });
    }

    // Check department
    const departments = await db.orm.public.Department.all();

    const department = departments.find(
      (dept) => dept.id === Number(departmentId),
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create User
    const user = await db.orm.public.User.create({
      name,
      email,
      passwordHash,
      role: "FACULTY",
      isActive: true,
    });

    // Create Faculty
    const faculty = await db.orm.public.Faculty.create({
      userId: user.id,
      employeeId,
      departmentId: Number(departmentId),
    });

    res.status(201).json({
      success: true,
      message: "Faculty created successfully",
      data: {
        user,
        faculty,
      },
    });
  } catch (error) {
    console.error("Error creating faculty:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create faculty",
    });
  }
};

export const getFacultyDashboard = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    // Find faculty profile linked to the logged-in user
    const facultyList = await db.orm.public.Faculty.all();

    const faculty = facultyList.find((item) => item.userId === userId);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty profile not found",
      });
    }

    // Get user details
    const users = await db.orm.public.User.all();

    const user = users.find((item) => item.id === userId);

    // Get department
    const departments = await db.orm.public.Department.all();

    const department = departments.find(
      (item) => item.id === faculty.departmentId,
    );

    // Get classes handled by this faculty
    const classes = await db.orm.public.Class.all();

    const facultyClasses = classes.filter(
      (item) => item.facultyId === faculty.id,
    );

    res.status(200).json({
      success: true,
      data: {
        id: faculty.id,
        employeeId: faculty.employeeId,
        name: user?.name ?? null,
        email: user?.email ?? null,
        department: department?.name ?? null,
        departmentCode: department?.code ?? null,
        totalClasses: facultyClasses.length,
      },
    });
  } catch (error) {
    console.error("Error fetching faculty dashboard:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch faculty dashboard",
    });
  }
};

export const getFacultyTimetable = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    // Find the logged-in faculty
    const facultyList = await db.orm.public.Faculty.all();

    const faculty = facultyList.find((item) => item.userId === userId);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty profile not found",
      });
    }

    // Get all classes handled by this faculty
    const classes = await db.orm.public.Class.all();

    const facultyClasses = classes.filter(
      (item) => item.facultyId === faculty.id,
    );

    const classIds = facultyClasses.map((item) => item.id);

    // Get timetable
    const timetable = await db.orm.public.Timetable.all();

    const facultyTimetable = timetable.filter((item) =>
      classIds.includes(item.classId),
    );

    // Get subjects
    const subjects = await db.orm.public.Subject.all();

    const result = facultyTimetable.map((entry) => {
      const classInfo = facultyClasses.find(
        (item) => item.id === entry.classId,
      );

      const subject = subjects.find((item) => item.id === classInfo?.subjectId);

      return {
        id: entry.id,
        dayOfWeek: entry.dayOfWeek,
        startTime: entry.startTime,
        endTime: entry.endTime,
        room: entry.room,
        classId: entry.classId,
        semester: classInfo?.semester ?? null,
        section: classInfo?.section ?? null,
        academicYear: classInfo?.academicYear ?? null,
        subject: subject
          ? {
              id: subject.id,
              code: subject.code,
              name: subject.name,
            }
          : null,
      };
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching faculty timetable:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch faculty timetable",
    });
  }
};

// ─── updateFaculty ──────────────────────────────────────────────────────────
export const updateFaculty = async (req, res) => {
  try {
    const id = Number(req.params.id || req.body.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Faculty ID is required",
      });
    }

    // Verify faculty exists
    const allFaculty = await db.orm.public.Faculty.all();
    const faculty = allFaculty.find((f) => f.id === id);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    const {
      name,
      email,
      password,
      employeeId,
      departmentId,
      designation,
      isActive,
    } = req.body;

    // Check duplicate email (if changed)
    if (email) {
      const users = await db.orm.public.User.all();
      const emailTaken = users.some(
        (u) => u.email === email && u.id !== faculty.userId,
      );

      if (emailTaken) {
        return res.status(409).json({
          success: false,
          message: "Email already in use by another user",
        });
      }
    }

    // Check duplicate employeeId (if changed)
    if (employeeId) {
      const faculties = await db.orm.public.Faculty.all();
      const empIdTaken = faculties.some(
        (f) => f.employeeId === employeeId && f.id !== id,
      );

      if (empIdTaken) {
        return res.status(409).json({
          success: false,
          message: "Employee ID already in use by another faculty",
        });
      }
    }

    // Verify department exists (if changed)
    if (departmentId) {
      const departments = await db.orm.public.Department.all();
      const dept = departments.find((d) => d.id === Number(departmentId));

      if (!dept) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }
    }

    // Build User update payload
    const userUpdate = {};
    if (name !== undefined) userUpdate.name = name;
    if (email !== undefined) userUpdate.email = email;
    if (isActive !== undefined) userUpdate.isActive = isActive;

    if (password) {
      userUpdate.passwordHash = await bcrypt.hash(password, 10);
    }

    if (Object.keys(userUpdate).length > 0) {
      await db.orm.public.User.where({ id: faculty.userId }).update(userUpdate);
    }

    // Build Faculty update payload
    const facultyUpdate = {};
    if (employeeId !== undefined) facultyUpdate.employeeId = employeeId;
    if (departmentId !== undefined)
      facultyUpdate.departmentId = Number(departmentId);
    if (designation !== undefined) facultyUpdate.designation = designation;

    if (Object.keys(facultyUpdate).length > 0) {
      await db.orm.public.Faculty.where({ id }).update(facultyUpdate);
    }

    // Fetch the updated records to return
    const updatedFaculty = (await db.orm.public.Faculty.all()).find(
      (f) => f.id === id,
    );
    const updatedUser = (await db.orm.public.User.all()).find(
      (u) => u.id === faculty.userId,
    );

    res.status(200).json({
      success: true,
      message: "Faculty updated successfully",
      data: {
        user: updatedUser,
        faculty: updatedFaculty,
      },
    });
  } catch (error) {
    console.error("Error updating faculty:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update faculty",
    });
  }
};
export const updatefaculty = updateFaculty;

// ─── deleteFaculty ──────────────────────────────────────────────────────────
export const deleteFaculty = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Faculty ID is required",
      });
    }

    // Verify faculty exists
    const allFaculty = await db.orm.public.Faculty.all();
    const faculty = allFaculty.find((f) => f.id === id);

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found",
      });
    }

    // Check if faculty has active classes assigned
    const classes = await db.orm.public.Class.all();
    const assignedClasses = classes.filter((c) => c.facultyId === id);

    if (assignedClasses.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete faculty: ${assignedClasses.length} class(es) are still assigned. Reassign them first.`,
      });
    }

    // Delete Faculty record
    await db.orm.public.Faculty.where({ id }).delete();

    // Delete associated User record
    await db.orm.public.User.where({ id: faculty.userId }).delete();

    res.status(200).json({
      success: true,
      message: "Faculty deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting faculty:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete faculty",
    });
  }
};
export const deletefaculty = deleteFaculty;

// ─── exportFaculty ──────────────────────────────────────────────────────────
export const exportFaculty = async (req, res) => {
  try {
    const allFaculty = await db.orm.public.Faculty.all();
    const users = await db.orm.public.User.all();
    const departments = await db.orm.public.Department.all();
    const classes = await db.orm.public.Class.all();

    const data = allFaculty.map((f) => {
      const user = users.find((u) => u.id === f.userId);
      const dept = departments.find((d) => d.id === f.departmentId);
      const assignedClasses = classes.filter((c) => c.facultyId === f.id);

      return {
        id: f.id,
        employeeId: f.employeeId,
        name: user?.name ?? "",
        email: user?.email ?? "",
        departmentName: dept?.name ?? "",
        departmentCode: dept?.code ?? "",
        designation: f.designation ?? "",
        isActive: user?.isActive ?? false,
        assignedClassesCount: assignedClasses.length,
        createdAt: f.createdAt ?? "",
      };
    });

    // CSV export
    if (req.query.format === "csv") {
      const headers = [
        "id",
        "employeeId",
        "name",
        "email",
        "departmentName",
        "departmentCode",
        "designation",
        "isActive",
        "assignedClassesCount",
        "createdAt",
      ];

      const csvRows = [headers.join(",")];

      for (const row of data) {
        const values = headers.map((h) => {
          const val = String(row[h] ?? "");
          // Escape commas and quotes in CSV values
          return val.includes(",") || val.includes('"')
            ? `"${val.replace(/"/g, '""')}"`
            : val;
        });
        csvRows.push(values.join(","));
      }

      const csvContent = csvRows.join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="faculty_export.csv"',
      );

      return res.status(200).send(csvContent);
    }

    // JSON export (default)
    res.status(200).json({
      success: true,
      data,
      total: data.length,
    });
  } catch (error) {
    console.error("Error exporting faculty:", error);

    res.status(500).json({
      success: false,
      message: "Failed to export faculty data",
    });
  }
};
export const exportfaculty = exportFaculty;

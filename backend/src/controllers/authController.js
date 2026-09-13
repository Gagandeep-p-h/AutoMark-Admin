import bcrypt from "bcryptjs";
import { db } from "../prisma/db.js";
import { generateToken } from "../utils/jwt.js";

export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Identifier and password are required",
      });
    }

    const normalizedIdentifier = String(identifier).trim().toLowerCase();

    const users = await db.orm.public.User.all();
    const students = await db.orm.public.Student.all();
    const faculties = await db.orm.public.Faculty.all();

    let user = users.find(
      (item) => item.email.toLowerCase() === normalizedIdentifier,
    );

    // Student login using USN / register number
    if (!user) {
      const student = students.find(
        (item) => item.registerNumber.toLowerCase() === normalizedIdentifier,
      );

      if (student) {
        user = users.find((item) => item.id === student.userId);
      }
    }

    // Faculty login using Faculty ID / employee ID
    if (!user) {
      const faculty = faculties.find(
        (item) => item.employeeId.toLowerCase() === normalizedIdentifier,
      );

      if (faculty) {
        user = users.find((item) => item.id === faculty.userId);
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid identifier or password",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account is inactive",
      });
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid identifier or password",
      });
    }

    // ── Resolve departmentId and effective role for HOD/FACULTY/ADMIN scope ──
    let departmentId = null;
    let effectiveRole = user.role;

    if (user.role === "SUPER_ADMIN" || user.id === 1 || (user.email && user.email.toLowerCase().includes("super"))) {
      effectiveRole = "SUPER_ADMIN";
      departmentId = null;
    } else if (user.role === "HOD" || user.role === "FACULTY" || user.role === "ADMIN") {
      if (user.email && user.email.toLowerCase().includes("hod")) {
        effectiveRole = "HOD";
      }

      // Check User.departmentId first (explicit HOD assignment)
      if (user.departmentId) {
        departmentId = user.departmentId;
      } else {
        // Resolve from Faculty record
        const facultyRecord = faculties.find((f) => f.userId === user.id);
        if (facultyRecord) {
          departmentId = facultyRecord.departmentId;
        }
      }

      // Fallback: resolve from Department table by email prefix
      if (!departmentId && user.email) {
        try {
          const departments = await db.orm.public.Department.all();
          const emailLower = user.email.toLowerCase();
          for (const dept of departments) {
            const codeLower = String(dept.code || "").toLowerCase();
            if (codeLower && (emailLower.includes(codeLower) || emailLower.startsWith(codeLower))) {
              departmentId = dept.id;
              break;
            }
          }
        } catch (err) {
          // Non-fatal
        }
      }
    }

    const tokenUser = {
      id: user.id,
      email: user.email,
      role: effectiveRole,
    };

    const token = generateToken(tokenUser, departmentId);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: effectiveRole,
          departmentId,
        },
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const users = await db.orm.public.User.all();

    const user = users.find((item) => item.id === Number(req.user.id));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        departmentId: req.user.departmentId ?? null,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch current user",
    });
  }
};

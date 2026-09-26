import { db } from "../prisma/db.js";
import bcrypt from "bcryptjs";
import { getHodDepartment } from "../utils/hodDepartment.js";
import {
  autoEnrollStudent,
  syncStudentEnrollments,
} from "../utils/enrollmentHelper.js";

const getStudentIdFromUser = async (userId) => {
  const students = await db.orm.public.Student.all();

  const student = students.find((item) => item.userId === Number(userId));

  return student?.id ?? null;
};

export const getStudents = async (req, res) => {
  try {
    const callerEmail = req.user?.email;
    const hodDepartment = getHodDepartment(callerEmail);

    let targetDepartment = null;
    if (hodDepartment) {
      targetDepartment = hodDepartment;
    } else {
      targetDepartment = req.query.department || null;
    }

    const students = await db.orm.public.Student.all();
    const departments = await db.orm.public.Department.all();

    let filtered = students;

    if (targetDepartment) {
      const target = targetDepartment.trim().toUpperCase();
      const matchingDept = departments.find(
        (d) =>
          d.code?.toUpperCase() === target ||
          d.name?.toUpperCase().includes(target),
      );

      filtered = filtered.filter((s) => {
        if (matchingDept && s.departmentId === matchingDept.id) return true;
        return false;
      });
    }

    res.status(200).json({
      success: true,
      data: filtered,
      total: filtered.length,
      isHod: Boolean(hodDepartment),
      department: targetDepartment,
    });
  } catch (error) {
    console.error("Error fetching students:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load students",
    });
  }
};

export const createStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      registerNumber,
      departmentId,
      semester,
      section,
      academicYear,
    } = req.body;

    // Check required fields
    if (
      !name ||
      !email ||
      !password ||
      !registerNumber ||
      !departmentId ||
      !semester ||
      !section ||
      !academicYear
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check whether email already exists
    const existingUsers = await db.orm.public.User.all();

    const emailExists = existingUsers.some((user) => user.email === email);

    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Check whether register number already exists
    const existingStudents = await db.orm.public.Student.all();

    const registerExists = existingStudents.some(
      (student) => student.registerNumber === registerNumber,
    );

    if (registerExists) {
      return res.status(409).json({
        success: false,
        message: "Register number already exists",
      });
    }

    // Check department exists
    const department = await db.orm.public.Department.all();

    const selectedDepartment = department.find(
      (dept) => dept.id === Number(departmentId),
    );

    if (!selectedDepartment) {
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
      role: "STUDENT",
      isActive: true,
    });

    // Create Student
    const student = await db.orm.public.Student.create({
      userId: user.id,
      registerNumber,
      departmentId: Number(departmentId),
      semester: Number(semester),
      section,
      academicYear,
    });

    // Auto-enroll student into matching classes
    await autoEnrollStudent(student);

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: {
        user,
        student,
      },
    });
  } catch (error) {
    console.error("Error creating student:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create student",
    });
  }
};

export const getStudentDashboard = async (req, res) => {
  try {
    const users = await db.orm.public.User.all();

    const user = users.find((item) => item.id === Number(req.user.id));

    if (!user || user.role !== "STUDENT") {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const students = await db.orm.public.Student.all();

    const student = students.find((item) => item.userId === user.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const departments = await db.orm.public.Department.all();

    const department = departments.find(
      (item) => item.id === student.departmentId,
    );

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student.id,
          registerNumber: student.registerNumber,
          name: user.name,
          email: user.email,
          department: department?.name ?? null,
          semester: student.semester,
          section: student.section,
          academicYear: student.academicYear,
        },
      },
    });
  } catch (error) {
    console.error("Student dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch student dashboard",
    });
  }
};

export const getStudentProfile = async (req, res) => {
  try {
    const users = await db.orm.public.User.all();

    const user = users.find((item) => item.id === Number(req.user.id));

    if (!user || user.role !== "STUDENT") {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const students = await db.orm.public.Student.all();

    const student = students.find((item) => item.userId === user.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const departments = await db.orm.public.Department.all();

    const department = departments.find(
      (item) => item.id === student.departmentId,
    );

    res.status(200).json({
      success: true,
      data: {
        id: student.id,
        registerNumber: student.registerNumber,
        name: user.name,
        email: user.email,
        department: department?.name ?? null,
        departmentCode: department?.code ?? null,
        semester: student.semester,
        section: student.section,
        academicYear: student.academicYear,
      },
    });
  } catch (error) {
    console.error("Student profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch student profile",
    });
  }
};

export const getStudentSubjects = async (req, res) => {
  try {
    const studentId = await getStudentIdFromUser(req.user.id);

    if (!studentId) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const enrollments = await db.orm.public.Enrollment.all();
    const classes = await db.orm.public.Class.all();
    const subjects = await db.orm.public.Subject.all();
    const faculty = await db.orm.public.Faculty.all();
    const users = await db.orm.public.User.all();

    const studentEnrollments = enrollments.filter(
      (item) => item.studentId === studentId,
    );

    const data = studentEnrollments.map((enrollment) => {
      const classItem = classes.find((item) => item.id === enrollment.classId);

      const subject = subjects.find((item) => item.id === classItem?.subjectId);

      const facultyItem = faculty.find(
        (item) => item.id === classItem?.facultyId,
      );

      const facultyUser = users.find((item) => item.id === facultyItem?.userId);

      return {
        enrollmentId: enrollment.id,
        classId: classItem?.id ?? null,
        subjectId: subject?.id ?? null,
        code: subject?.code ?? null,
        name: subject?.name ?? null,
        credits: subject?.credits ?? null,
        faculty: facultyUser?.name ?? null,
        semester: classItem?.semester ?? null,
        section: classItem?.section ?? null,
        academicYear: classItem?.academicYear ?? null,
      };
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Student subjects error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch student subjects",
    });
  }
};

export const getStudentSubjectDetails = async (req, res) => {
  try {
    const studentId = await getStudentIdFromUser(req.user.id);
    const subjectId = Number(req.params.id);

    if (!studentId) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID",
      });
    }

    const enrollments = await db.orm.public.Enrollment.all();
    const classes = await db.orm.public.Class.all();
    const subjects = await db.orm.public.Subject.all();
    const faculty = await db.orm.public.Faculty.all();
    const users = await db.orm.public.User.all();
    const sessions = await db.orm.public.AttendanceSession.all();
    const attendance = await db.orm.public.Attendance.all();

    // Find classes where this student is enrolled
    const studentEnrollments = enrollments.filter(
      (item) => item.studentId === studentId,
    );

    const enrollment = studentEnrollments.find((item) => {
      const classItem = classes.find(
        (classItem) => classItem.id === item.classId,
      );

      return classItem?.subjectId === subjectId;
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Subject not found for this student",
      });
    }

    const classItem = classes.find((item) => item.id === enrollment.classId);

    const subject = subjects.find((item) => item.id === classItem?.subjectId);

    const facultyItem = faculty.find(
      (item) => item.id === classItem?.facultyId,
    );

    const facultyUser = users.find((item) => item.id === facultyItem?.userId);

    // Sessions belonging to this class
    const classSessions = sessions.filter(
      (item) => item.classId === classItem.id,
    );

    // Attendance records belonging to this student and these sessions
    const studentAttendance = attendance.filter(
      (item) =>
        item.studentId === studentId &&
        classSessions.some((session) => session.id === item.sessionId),
    );

    const totalClasses = classSessions.length;

    const present = studentAttendance.filter(
      (item) => item.status === "PRESENT",
    ).length;

    const absent = studentAttendance.filter(
      (item) => item.status === "ABSENT",
    ).length;

    const late = studentAttendance.filter(
      (item) => item.status === "LATE",
    ).length;

    const attendancePercentage =
      totalClasses > 0
        ? Number(((present / totalClasses) * 100).toFixed(2))
        : 0;

    res.status(200).json({
      success: true,
      data: {
        subject: {
          id: subject.id,
          code: subject.code,
          name: subject.name,
          credits: subject.credits,
        },
        faculty: facultyUser?.name ?? null,
        class: {
          id: classItem.id,
          semester: classItem.semester,
          section: classItem.section,
          academicYear: classItem.academicYear,
        },
        attendance: {
          totalClasses,
          present,
          absent,
          late,
          percentage: attendancePercentage,
        },
      },
    });
  } catch (error) {
    console.error("Student subject details error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch subject details",
    });
  }
};

export const getStudentTimetable = async (req, res) => {
  try {
    const studentId = await getStudentIdFromUser(req.user.id);

    if (!studentId) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const enrollments = await db.orm.public.Enrollment.all();
    const classes = await db.orm.public.Class.all();
    const timetables = await db.orm.public.Timetable.all();
    const subjects = await db.orm.public.Subject.all();
    const faculty = await db.orm.public.Faculty.all();
    const users = await db.orm.public.User.all();

    const studentEnrollments = enrollments.filter(
      (item) => item.studentId === studentId,
    );

    const data = [];

    for (const enrollment of studentEnrollments) {
      const classItem = classes.find((item) => item.id === enrollment.classId);

      if (!classItem) continue;

      const subject = subjects.find((item) => item.id === classItem.subjectId);

      const facultyItem = faculty.find(
        (item) => item.id === classItem.facultyId,
      );

      const facultyUser = users.find((item) => item.id === facultyItem?.userId);

      const classTimetable = timetables.filter(
        (item) => item.classId === classItem.id,
      );

      for (const timetable of classTimetable) {
        data.push({
          id: timetable.id,
          dayOfWeek: timetable.dayOfWeek,
          startTime: timetable.startTime,
          endTime: timetable.endTime,
          room: timetable.room,
          subject: {
            id: subject?.id ?? null,
            code: subject?.code ?? null,
            name: subject?.name ?? null,
          },
          faculty: facultyUser?.name ?? null,
          classId: classItem.id,
        });
      }
    }

    // Also fetch new TimetableSlot data for the student's section/batch (additive, non-breaking)
    let slotData = [];
    let studentBatch = null;
    try {
      // Find student's info
      const students = await db.orm.public.Student.all();
      const studentRecord = students.find((s) => s.id === studentId);

      if (studentRecord) {
        // Get student's lab batch assignment
        try {
          const studentBatches = await db.orm.public.StudentBatch.all();
          const batchEntry = studentBatches.find(
            (sb) => sb.studentId === studentId,
          );

          if (batchEntry) {
            const batches = await db.orm.public.LabBatch.all();
            studentBatch =
              batches.find((b) => b.id === batchEntry.batchId) || null;
          }
        } catch {
          // StudentBatch table not yet migrated - graceful fallback
        }

        // Get TimetableSlots for this student's class enrollments
        try {
          const timetableSlots = await db.orm.public.TimetableSlot.all();
          const enrolledClassIds = studentEnrollments.map((e) => e.classId);

          const relevantSlots = timetableSlots.filter((slot) => {
            if (!enrolledClassIds.includes(slot.classId)) return false;
            // If it's a lab slot, only show if batch matches student's batch (or no batch assigned)
            if (slot.isLab && slot.batchId && studentBatch) {
              return slot.batchId === studentBatch.id;
            }
            return true;
          });

          for (const slot of relevantSlots) {
            const cls = classes.find((c) => c.id === slot.classId);
            if (!cls) continue;
            const subj = subjects.find((s) => s.id === cls.subjectId);
            const fac = faculty.find((f) => f.id === cls.facultyId);
            const facUser = users.find((u) => u.id === fac?.userId);

            slotData.push({
              id: `slot_${slot.id}`,
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
              isLab: slot.isLab,
              batchName: studentBatch?.name || null,
              subject: {
                id: subj?.id ?? null,
                code: subj?.code ?? null,
                name: subj?.name ?? null,
              },
              faculty: facUser?.name ?? null,
              classId: slot.classId,
              room: null,
            });
          }
        } catch {
          // TimetableSlot table not yet migrated - graceful fallback
        }
      }
    } catch {
      // Non-critical: batch data unavailable
    }

    // Merge legacy timetable + new slot data (deduplicate by class+day+time)
    const merged = [...data];
    for (const slot of slotData) {
      const duplicate = merged.some(
        (d) =>
          d.classId === slot.classId &&
          String(d.dayOfWeek) === String(slot.dayOfWeek) &&
          d.startTime === slot.startTime,
      );
      if (!duplicate) merged.push(slot);
    }

    merged.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) {
        return String(a.dayOfWeek).localeCompare(String(b.dayOfWeek));
      }
      return String(a.startTime).localeCompare(String(b.startTime));
    });

    res.status(200).json({
      success: true,
      data: merged,
      // Extra metadata for mobile app (non-breaking additions)
      meta: {
        labBatch: studentBatch
          ? { id: studentBatch.id, name: studentBatch.name }
          : null,
      },
    });
  } catch (error) {
    console.error("Student timetable error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch student timetable",
    });
  }
};

export const getStudentAttendance = async (req, res) => {
  try {
    const studentId = await getStudentIdFromUser(req.user.id);

    if (!studentId) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const enrollments = await db.orm.public.Enrollment.all();
    const classes = await db.orm.public.Class.all();
    const subjects = await db.orm.public.Subject.all();
    const sessions = await db.orm.public.AttendanceSession.all();
    const attendance = await db.orm.public.Attendance.all();

    const studentEnrollments = enrollments.filter(
      (item) => item.studentId === studentId,
    );

    const data = studentEnrollments.map((enrollment) => {
      const classItem = classes.find((item) => item.id === enrollment.classId);

      const subject = subjects.find((item) => item.id === classItem?.subjectId);

      const classSessions = sessions.filter(
        (session) => session.classId === classItem?.id,
      );

      const studentAttendance = attendance.filter(
        (item) =>
          item.studentId === studentId &&
          classSessions.some((session) => session.id === item.sessionId),
      );

      const totalClasses = classSessions.length;

      const present = studentAttendance.filter(
        (item) => item.status === "PRESENT",
      ).length;

      const absent = studentAttendance.filter(
        (item) => item.status === "ABSENT",
      ).length;

      const late = studentAttendance.filter(
        (item) => item.status === "LATE",
      ).length;

      const percentage =
        totalClasses > 0
          ? Number(((present / totalClasses) * 100).toFixed(2))
          : 0;

      return {
        subjectId: subject?.id ?? null,
        code: subject?.code ?? null,
        subject: subject?.name ?? null,
        totalClasses,
        present,
        absent,
        late,
        percentage,
      };
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Student attendance error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch student attendance",
    });
  }
};

export const getStudentAttendanceHistory = async (req, res) => {
  try {
    const studentId = await getStudentIdFromUser(req.user.id);

    if (!studentId) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const attendance = await db.orm.public.Attendance.all();
    const sessions = await db.orm.public.AttendanceSession.all();
    const classes = await db.orm.public.Class.all();
    const subjects = await db.orm.public.Subject.all();

    const studentAttendance = attendance.filter(
      (item) => item.studentId === studentId,
    );

    const data = studentAttendance.map((record) => {
      const session = sessions.find((item) => item.id === record.sessionId);

      const classItem = classes.find((item) => item.id === session?.classId);

      const subject = subjects.find((item) => item.id === classItem?.subjectId);

      return {
        attendanceId: record.id,
        sessionId: record.sessionId,
        date: session?.sessionDate ?? null,
        markedAt: record.markedAt,
        status: record.status,
        source: record.source,
        subject: {
          id: subject?.id ?? null,
          code: subject?.code ?? null,
          name: subject?.name ?? null,
        },
      };
    });

    data.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(b.date) - new Date(a.date);
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Student attendance history error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance history",
    });
  }
};

// ─── updateStudent ──────────────────────────────────────────────────────────
export const updateStudent = async (req, res) => {
  try {
    const id = Number(req.params.id || req.body.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    // Verify student exists
    const allStudents = await db.orm.public.Student.all();
    const student = allStudents.find((s) => s.id === id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // HOD department isolation
    const hodDepartmentId = req.user?.departmentId ?? null;

    if (
      hodDepartmentId &&
      Number(student.departmentId) !== Number(hodDepartmentId)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden: HOD cannot manage students from another department",
      });
    }

    const {
      name,
      email,
      password,
      registerNumber,
      departmentId,
      semester,
      section,
      academicYear,
      isActive,
    } = req.body;

    // Check duplicate email (if changed)
    if (email) {
      const users = await db.orm.public.User.all();
      const emailTaken = users.some(
        (u) => u.email === email && u.id !== student.userId,
      );

      if (emailTaken) {
        return res.status(409).json({
          success: false,
          message: "Email already in use by another user",
        });
      }
    }

    // Check duplicate registerNumber (if changed)
    if (registerNumber) {
      const students = await db.orm.public.Student.all();
      const regTaken = students.some(
        (s) => s.registerNumber === registerNumber && s.id !== id,
      );

      if (regTaken) {
        return res.status(409).json({
          success: false,
          message: "Register number already in use by another student",
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

      // HOD cannot move a student to another department
      if (hodDepartmentId && Number(departmentId) !== Number(hodDepartmentId)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: HOD cannot move students to another department",
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
      await db.orm.public.User.where({ id: student.userId }).update(userUpdate);
    }

    // Build Student update payload
    const studentUpdate = {};
    if (registerNumber !== undefined)
      studentUpdate.registerNumber = registerNumber;
    if (departmentId !== undefined)
      studentUpdate.departmentId = Number(departmentId);
    if (semester !== undefined) studentUpdate.semester = Number(semester);
    if (section !== undefined) studentUpdate.section = section;
    if (academicYear !== undefined) studentUpdate.academicYear = academicYear;

    if (Object.keys(studentUpdate).length > 0) {
      await db.orm.public.Student.where({ id }).update(studentUpdate);
    }

    if (Object.keys(studentUpdate).length > 0) {
      const updatedStudentForSync = (await db.orm.public.Student.all()).find(
        (s) => s.id === id,
      );

      if (updatedStudentForSync) {
        await syncStudentEnrollments(updatedStudentForSync);
      }
    }

    // Fetch the updated records to return
    const updatedStudent = (await db.orm.public.Student.all()).find(
      (s) => s.id === id,
    );
    const updatedUser = (await db.orm.public.User.all()).find(
      (u) => u.id === student.userId,
    );

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: {
        user: updatedUser,
        student: updatedStudent,
      },
    });
  } catch (error) {
    console.error("Error updating student:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update student",
    });
  }
};
export const updatestudent = updateStudent;

// ─── deleteStudent ──────────────────────────────────────────────────────────
export const deleteStudent = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    // Verify student exists
    const allStudents = await db.orm.public.Student.all();
    const student = allStudents.find((s) => s.id === id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // HOD department isolation
    const hodDepartmentId = req.user?.departmentId ?? null;

    if (
      hodDepartmentId &&
      Number(student.departmentId) !== Number(hodDepartmentId)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden: HOD cannot manage students from another department",
      });
    }

    // Clean up dependent child records in correct order

    // 1. Delete AttendanceLogs (via Attendance records)
    const allAttendance = await db.orm.public.Attendance.all();
    const studentAttendance = allAttendance.filter((a) => a.studentId === id);

    for (const att of studentAttendance) {
      try {
        await db.orm.public.AttendanceLog.where({
          attendanceId: att.id,
        }).delete();
      } catch {
        // No logs for this attendance record - that's fine
      }
    }

    // 2. Delete Attendance records
    for (const att of studentAttendance) {
      try {
        await db.orm.public.Attendance.where({ id: att.id }).delete();
      } catch {
        // Already deleted or doesn't exist
      }
    }

    // 3. Delete Enrollment records
    const allEnrollments = await db.orm.public.Enrollment.all();
    const studentEnrollments = allEnrollments.filter((e) => e.studentId === id);

    for (const enrollment of studentEnrollments) {
      try {
        await db.orm.public.Enrollment.where({ id: enrollment.id }).delete();
      } catch {
        // Already deleted or doesn't exist
      }
    }

    // 4. Delete StudentBatch records (if any)
    try {
      const allBatches = await db.orm.public.StudentBatch.all();
      const studentBatches = allBatches.filter((sb) => sb.studentId === id);

      for (const sb of studentBatches) {
        await db.orm.public.StudentBatch.where({ id: sb.id }).delete();
      }
    } catch {
      // StudentBatch table may not exist yet
    }

    // 5. Delete StudentDevice records (if any)
    try {
      const allDevices = await db.orm.public.StudentDevice.all();
      const studentDevices = allDevices.filter((d) => d.studentId === id);

      for (const device of studentDevices) {
        await db.orm.public.StudentDevice.where({ id: device.id }).delete();
      }
    } catch {
      // StudentDevice table may not exist
    }

    // 6. Delete the Student record
    await db.orm.public.Student.where({ id }).delete();

    // 7. Delete the associated User record
    await db.orm.public.User.where({ id: student.userId }).delete();

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting student:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete student",
    });
  }
};
export const deletestudent = deleteStudent;

// ─── createSection ──────────────────────────────────────────────────────────
export const createSection = async (req, res) => {
  try {
    const {
      section: sectionName,
      name,
      departmentId,
      semester,
      academicYear,
      studentIds,
    } = req.body;

    const section = sectionName || name;

    if (!section || !departmentId || !semester || !academicYear) {
      return res.status(400).json({
        success: false,
        message:
          "section, departmentId, semester, and academicYear are required",
      });
    }

    // Verify department exists
    const departments = await db.orm.public.Department.all();
    const dept = departments.find((d) => d.id === Number(departmentId));

    if (!dept) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const allStudents = await db.orm.public.Student.all();
    const allUsers = await db.orm.public.User.all();
    let sectionStudents = [];

    if (Array.isArray(studentIds) && studentIds.length > 0) {
      // Assign the given students to this section
      for (const sid of studentIds) {
        const studentId = Number(sid);
        const student = allStudents.find((s) => s.id === studentId);

        if (student) {
          try {
            await db.orm.public.Student.where({ id: studentId }).update({
              section,
              semester: Number(semester),
              departmentId: Number(departmentId),
              academicYear,
            });
          } catch {
            // Student may already have these values
          }
        }
      }

      // Re-fetch to get updated records
      const refreshedStudents = await db.orm.public.Student.all();
      sectionStudents = refreshedStudents.filter(
        (s) =>
          s.section === section &&
          s.departmentId === Number(departmentId) &&
          s.semester === Number(semester) &&
          s.academicYear === academicYear,
      );
    } else {
      // List existing students in this section
      sectionStudents = allStudents.filter(
        (s) =>
          s.section === section &&
          s.departmentId === Number(departmentId) &&
          s.semester === Number(semester) &&
          s.academicYear === academicYear,
      );
    }

    // Enrich with user info
    const enriched = sectionStudents.map((s) => {
      const user = allUsers.find((u) => u.id === s.userId);
      return {
        id: s.id,
        registerNumber: s.registerNumber,
        name: user?.name ?? "",
        email: user?.email ?? "",
        semester: s.semester,
        section: s.section,
        academicYear: s.academicYear,
      };
    });

    res.status(200).json({
      success: true,
      message:
        Array.isArray(studentIds) && studentIds.length > 0
          ? "Students assigned to section successfully"
          : "Section students retrieved",
      data: {
        section,
        departmentId: Number(departmentId),
        departmentName: dept.name,
        semester: Number(semester),
        academicYear,
        students: enriched,
        count: enriched.length,
      },
    });
  } catch (error) {
    console.error("Error in createSection:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create/retrieve section",
    });
  }
};
export const createsection = createSection;

// ─── createLabBatch ─────────────────────────────────────────────────────────
export const createLabBatch = async (req, res) => {
  try {
    const {
      batchName,
      section,
      departmentId,
      semester,
      academicYear,
      studentIds,
      rollNumbers,
    } = req.body;

    if (!batchName || !section || !departmentId || !semester || !academicYear) {
      return res.status(400).json({
        success: false,
        message:
          "batchName, section, departmentId, semester, and academicYear are required",
      });
    }

    // Verify department exists
    const departments = await db.orm.public.Department.all();
    const dept = departments.find((d) => d.id === Number(departmentId));

    if (!dept) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Get all students in the target section
    const allStudents = await db.orm.public.Student.all();
    const sectionStudents = allStudents.filter(
      (s) =>
        s.section === section &&
        s.departmentId === Number(departmentId) &&
        s.semester === Number(semester) &&
        s.academicYear === academicYear,
    );

    // Filter by studentIds, rollNumbers, or use all section students
    let batchStudents;

    if (Array.isArray(studentIds) && studentIds.length > 0) {
      const idSet = new Set(studentIds.map(Number));
      batchStudents = sectionStudents.filter((s) => idSet.has(s.id));
    } else if (Array.isArray(rollNumbers) && rollNumbers.length > 0) {
      const rollSet = new Set(rollNumbers.map(String));
      batchStudents = sectionStudents.filter((s) =>
        rollSet.has(s.registerNumber),
      );
    } else {
      batchStudents = sectionStudents;
    }

    // Enrich with user info
    const allUsers = await db.orm.public.User.all();
    const enriched = batchStudents.map((s) => {
      const user = allUsers.find((u) => u.id === s.userId);
      return {
        id: s.id,
        registerNumber: s.registerNumber,
        name: user?.name ?? "",
        email: user?.email ?? "",
        semester: s.semester,
        section: s.section,
        academicYear: s.academicYear,
      };
    });

    res.status(200).json({
      success: true,
      message: "Lab batch created successfully",
      data: {
        batchName,
        section,
        departmentId: Number(departmentId),
        departmentName: dept.name,
        semester: Number(semester),
        academicYear,
        students: enriched,
        count: enriched.length,
      },
    });
  } catch (error) {
    console.error("Error in createLabBatch:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create lab batch",
    });
  }
};
export const createlabbatch = createLabBatch;

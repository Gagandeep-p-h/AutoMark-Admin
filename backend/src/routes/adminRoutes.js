import express from "express";
import multer from "multer";

import {
  getAdminDashboard,
  getAdminStudents,
  createAdminStudent,
  importAdminStudents,
  assignAdminStudentDivision,
  assignAdminStudentLabBatch,
  updateAdminStudent,
  deleteAdminStudent,
  getAdminStudentDevice,
  resetAdminStudentDevice,
  exportAdminStudents,
  getAdminFaculty,
  createAdminFaculty,
  updateAdminFaculty,
  deleteAdminFaculty,
  exportAdminFaculty,
} from "../controllers/adminController.js";

import {
  getAdminTimetable,
  saveAdminTimetableGrid,
  importAdminTimetable,
  exportAdminTimetable,
  getAdminBatches,
  createOrSplitBatches,
  assignStudentBatch,
} from "../controllers/timetableManagementController.js";

import { getAuditLogs } from "../controllers/auditController.js";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
});

// ─── Dashboard ─────────────────────────────────────────────────────────────────
// SUPER_ADMIN and ADMIN/HOD can see dashboard (SUPER_ADMIN bypasses via roleMiddleware)
router.get("/dashboard", authenticate, authorize("ADMIN", "HOD"), getAdminDashboard);

// ─── Student Management Routes ────────────────────────────────────────────────
// HOD can list/manage students in their own dept; SUPER_ADMIN/ADMIN see all
router.get(
  "/students",
  authenticate,
  authorize("ADMIN", "HOD", "FACULTY"),
  getAdminStudents
);

router.post(
  "/students",
  authenticate,
  authorize("ADMIN", "HOD"),
  createAdminStudent
);

router.post(
  "/students/import",
  authenticate,
  authorize("ADMIN", "HOD"),
  upload.single("file"),
  importAdminStudents
);

router.patch(
  "/students/division",
  authenticate,
  authorize("ADMIN", "HOD"),
  assignAdminStudentDivision
);

router.post(
  "/students/division",
  authenticate,
  authorize("ADMIN", "HOD"),
  assignAdminStudentDivision
);

router.post(
  "/students/assign-division",
  authenticate,
  authorize("ADMIN", "HOD"),
  assignAdminStudentDivision
);

router.patch(
  "/students/lab-batch",
  authenticate,
  authorize("ADMIN", "HOD"),
  assignAdminStudentLabBatch
);

router.post(
  "/students/lab-batch",
  authenticate,
  authorize("ADMIN", "HOD"),
  assignAdminStudentLabBatch
);

router.post(
  "/students/assign-lab-batch",
  authenticate,
  authorize("ADMIN", "HOD"),
  assignAdminStudentLabBatch
);

// Student Export — must come BEFORE :id routes to avoid shadowing
router.get(
  "/students/export",
  authenticate,
  authorize("ADMIN", "HOD", "FACULTY"),
  exportAdminStudents
);

router.get(
  "/students/:id/device",
  authenticate,
  authorize("ADMIN", "HOD", "FACULTY"),
  getAdminStudentDevice
);

router.post(
  "/students/:id/device/reset",
  authenticate,
  authorize("ADMIN", "HOD"),
  resetAdminStudentDevice
);

router.patch(
  "/students/:id",
  authenticate,
  authorize("ADMIN", "HOD"),
  updateAdminStudent
);

router.delete(
  "/students/:id",
  authenticate,
  authorize("ADMIN", "HOD"),
  deleteAdminStudent
);

// ─── Faculty Management Routes ────────────────────────────────────────────────
// Faculty export — must come BEFORE :id route
router.get(
  "/faculty/export",
  authenticate,
  authorize("ADMIN", "HOD"),
  exportAdminFaculty
);

router.get(
  "/faculty",
  authenticate,
  authorize("ADMIN", "HOD"),
  getAdminFaculty
);

router.post(
  "/faculty",
  authenticate,
  authorize("ADMIN", "HOD"),
  createAdminFaculty
);

router.put(
  "/faculty/:id",
  authenticate,
  authorize("ADMIN", "HOD"),
  updateAdminFaculty
);

router.patch(
  "/faculty/:id",
  authenticate,
  authorize("ADMIN", "HOD"),
  updateAdminFaculty
);

router.delete(
  "/faculty/:id",
  authenticate,
  authorize("ADMIN", "HOD"),
  deleteAdminFaculty
);

// ─── Timetable Management Routes ──────────────────────────────────────────────
// GET /api/admin/timetable  — query by academicYear, departmentId, semester, section
router.get(
  "/timetable",
  authenticate,
  authorize("ADMIN", "HOD", "FACULTY"),
  getAdminTimetable
);

// POST /api/admin/timetable/grid  — bulk upsert grid slots from the web UI
router.post(
  "/timetable/grid",
  authenticate,
  authorize("ADMIN", "HOD", "FACULTY"),
  saveAdminTimetableGrid
);

// POST /api/admin/timetable/import  — parse uploaded Excel/CSV via multer
router.post(
  "/timetable/import",
  authenticate,
  authorize("ADMIN", "HOD", "FACULTY"),
  upload.single("file"),
  importAdminTimetable
);

// GET /api/admin/timetable/export  — download as .xlsx or .pdf
router.get(
  "/timetable/export",
  authenticate,
  authorize("ADMIN", "HOD", "FACULTY"),
  exportAdminTimetable
);

// ─── Lab Batch Management Routes ──────────────────────────────────────────────
// GET /api/admin/batches  — list batches for a dept/sem/section
router.get(
  "/batches",
  authenticate,
  authorize("ADMIN", "HOD", "FACULTY"),
  getAdminBatches
);

// POST /api/admin/batches  — create or split section into B1, B2, B3
router.post(
  "/batches",
  authenticate,
  authorize("ADMIN", "HOD", "FACULTY"),
  createOrSplitBatches
);

// POST /api/admin/batches/assign  — assign a single student to a batch
router.post(
  "/batches/assign",
  authenticate,
  authorize("ADMIN", "HOD", "FACULTY"),
  assignStudentBatch
);

// ─── Audit Logs ────────────────────────────────────────────────────────────────
// SUPER_ADMIN can see all; ADMIN/HOD see their dept (controller enforces)
router.get(
  "/audit-logs",
  authenticate,
  authorize("ADMIN", "HOD"),
  getAuditLogs
);

export default router;

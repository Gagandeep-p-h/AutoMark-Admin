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

import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
});

router.get("/dashboard", authenticate, authorize("ADMIN"), getAdminDashboard);

router.get("/students", authenticate, authorize("ADMIN", "FACULTY", "HOD"), getAdminStudents);

router.post("/students", authenticate, authorize("ADMIN", "FACULTY", "HOD"), createAdminStudent);

router.post(
  "/students/import",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  upload.single("file"),
  importAdminStudents
);

router.patch(
  "/students/division",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  assignAdminStudentDivision
);

router.post(
  "/students/division",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  assignAdminStudentDivision
);

router.post(
  "/students/assign-division",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  assignAdminStudentDivision
);

router.patch(
  "/students/lab-batch",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  assignAdminStudentLabBatch
);

router.post(
  "/students/lab-batch",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  assignAdminStudentLabBatch
);

router.post(
  "/students/assign-lab-batch",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  assignAdminStudentLabBatch
);

router.get(
  "/students/:id/device",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  getAdminStudentDevice
);

router.post(
  "/students/:id/device/reset",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  resetAdminStudentDevice
);

router.patch(
  "/students/:id",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  updateAdminStudent
);

router.delete(
  "/students/:id",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  deleteAdminStudent
);

// Student Export (PDF, XLS, XLSX)
router.get(
  "/students/export",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  exportAdminStudents
);

// Faculty Management Routes
router.get(
  "/faculty",
  authenticate,
  authorize("ADMIN"),
  getAdminFaculty
);

router.post(
  "/faculty",
  authenticate,
  authorize("ADMIN"),
  createAdminFaculty
);

router.get(
  "/faculty/export",
  authenticate,
  authorize("ADMIN"),
  exportAdminFaculty
);

router.put(
  "/faculty/:id",
  authenticate,
  authorize("ADMIN"),
  updateAdminFaculty
);

router.patch(
  "/faculty/:id",
  authenticate,
  authorize("ADMIN"),
  updateAdminFaculty
);

router.delete(
  "/faculty/:id",
  authenticate,
  authorize("ADMIN"),
  deleteAdminFaculty
);

// ─── Timetable Management Routes ─────────────────────────────────────────────
// GET /api/admin/timetable  — query by academicYear, departmentId, semester, section
router.get(
  "/timetable",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  getAdminTimetable
);

// POST /api/admin/timetable/grid  — bulk upsert grid slots from the web UI
router.post(
  "/timetable/grid",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  saveAdminTimetableGrid
);

// POST /api/admin/timetable/import  — parse uploaded Excel/CSV via multer
router.post(
  "/timetable/import",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  upload.single("file"),
  importAdminTimetable
);

// GET /api/admin/timetable/export  — download as .xlsx or .pdf
router.get(
  "/timetable/export",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  exportAdminTimetable
);

// ─── Lab Batch Management Routes ──────────────────────────────────────────────
// GET /api/admin/batches  — list batches for a dept/sem/section
router.get(
  "/batches",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  getAdminBatches
);

// POST /api/admin/batches  — create or split section into B1, B2, B3
router.post(
  "/batches",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  createOrSplitBatches
);

// POST /api/admin/batches/assign  — assign a single student to a batch
router.post(
  "/batches/assign",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  assignStudentBatch
);

export default router;




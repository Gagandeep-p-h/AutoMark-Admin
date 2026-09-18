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

// Dashboard
router.get("/dashboard", authenticate, authorize("ADMIN", "HOD"), getAdminDashboard);

// Student Management Routes
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

// Student Export - must come BEFORE :id routes to avoid shadowing
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

router.put(
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

// Faculty Management Routes
// Faculty export - must come BEFORE :id route
router.get(
  "/faculty/export",
  authenticate,
  authorize("ADMIN", "HOD"),
  exportAdminFaculty
);

router.get(
  "/faculty",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  getAdminFaculty
);

router.post(
  "/faculty",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  createAdminFaculty
);

router.put(
  "/faculty/:id",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  updateAdminFaculty
);

router.patch(
  "/faculty/:id",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  updateAdminFaculty
);

router.delete(
  "/faculty/:id",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  deleteAdminFaculty
);

// Timetable Management Routes
router.get(
  "/timetable",
  authenticate,
  authorize("ADMIN", "HOD", "FACULTY"),
  getAdminTimetable
);

router.post(
  "/timetable/grid",
  authenticate,
  authorize("ADMIN", "HOD", "FACULTY"),
  saveAdminTimetableGrid
);

router.post(
  "/timetable/import",
  authenticate,
  authorize("ADMIN", "HOD", "FACULTY"),
  upload.single("file"),
  importAdminTimetable
);

router.get(
  "/timetable/export",
  authenticate,
  authorize("ADMIN", "HOD", "FACULTY"),
  exportAdminTimetable
);

// Lab Batch Management Routes
router.get(
  "/batches",
  authenticate,
  authorize("ADMIN", "HOD", "FACULTY"),
  getAdminBatches
);

router.post(
  "/batches",
  authenticate,
  authorize("ADMIN", "HOD", "FACULTY"),
  createOrSplitBatches
);

router.post(
  "/batches/assign",
  authenticate,
  authorize("ADMIN", "HOD", "FACULTY"),
  assignStudentBatch
);

// Audit Logs
router.get(
  "/audit-logs",
  authenticate,
  authorize("ADMIN", "HOD"),
  getAuditLogs
);

export default router;

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
  authorize("ADMIN", "FACULTY", "HOD"),
  getAdminFaculty
);

router.post(
  "/faculty",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  createAdminFaculty
);

router.get(
  "/faculty/export",
  authenticate,
  authorize("ADMIN", "FACULTY", "HOD"),
  exportAdminFaculty
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

export default router;


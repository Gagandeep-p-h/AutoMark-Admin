import express from "express";
import multer from "multer";

import {
  getAdminDashboard,
  getAdminStudents,
  createAdminStudent,
  importAdminStudents,
  assignAdminStudentDivision,
  updateAdminStudent,
  deleteAdminStudent,
  getAdminStudentDevice,
  resetAdminStudentDevice,
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

export default router;


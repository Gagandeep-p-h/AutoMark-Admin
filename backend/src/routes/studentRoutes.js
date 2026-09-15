import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  createSection,
  createLabBatch,
} from "../controllers/studentController.js";

const router = express.Router();

// Static routes MUST come before parameterized routes
router.post("/section", authenticate, authorize("ADMIN", "HOD"), createSection);
router.post("/lab-batch", authenticate, authorize("ADMIN", "HOD"), createLabBatch);

router.get("/", authenticate, authorize("ADMIN", "HOD", "FACULTY"), getStudents);
router.post("/", authenticate, authorize("ADMIN", "HOD"), createStudent);
router.put("/:id", authenticate, authorize("ADMIN", "HOD"), updateStudent);
router.delete("/:id", authenticate, authorize("ADMIN", "HOD"), deleteStudent);

export default router;

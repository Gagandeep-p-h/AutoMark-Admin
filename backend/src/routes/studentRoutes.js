import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

import {
  getStudents,
  createStudent,
} from "../controllers/studentController.js";

const router = express.Router();

router.get("/", authenticate, authorize("ADMIN", "HOD", "FACULTY"), getStudents);
router.post("/", authenticate, authorize("ADMIN", "HOD"), createStudent);

export default router;

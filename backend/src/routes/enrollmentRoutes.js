import express from "express";

import {
  getEnrollments,
  createEnrollment,
} from "../controllers/enrollmentController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", getEnrollments);
router.post("/", authenticate, authorize("ADMIN", "HOD"), createEnrollment);

export default router;

import express from "express";

import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../controllers/subjectController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", getSubjects);
router.post("/", authenticate, authorize("ADMIN", "HOD"), createSubject);
router.put("/:id", authenticate, authorize("ADMIN", "HOD"), updateSubject);
router.delete("/:id", authenticate, authorize("ADMIN", "HOD"), deleteSubject);

export default router;

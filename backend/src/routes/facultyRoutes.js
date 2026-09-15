import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

import {
  getFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  exportFaculty,
} from "../controllers/facultyController.js";

const router = express.Router();

// Static routes MUST come before parameterized routes
router.get("/export", authenticate, authorize("ADMIN", "HOD"), exportFaculty);

router.get("/", authenticate, authorize("ADMIN", "HOD"), getFaculty);
router.post("/", authenticate, authorize("ADMIN", "HOD"), createFaculty);
router.put("/:id", authenticate, authorize("ADMIN", "HOD"), updateFaculty);
router.delete("/:id", authenticate, authorize("ADMIN", "HOD"), deleteFaculty);

export default router;

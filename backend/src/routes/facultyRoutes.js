import express from "express";

import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

import { getFaculty, createFaculty } from "../controllers/facultyController.js";

const router = express.Router();

router.get("/", authenticate, authorize("ADMIN", "HOD"), getFaculty);
router.post("/", authenticate, authorize("ADMIN", "HOD"), createFaculty);

export default router;

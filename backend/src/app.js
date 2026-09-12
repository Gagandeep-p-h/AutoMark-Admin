import { webcrypto } from "node:crypto";
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

import express from "express";
import cors from "cors";
import departmentRoutes from "./routes/departmentRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import facultyRoutes from "./routes/facultyRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import classRoutes from "./routes/classRoutes.js";
import enrollmentRoutes from "./routes/enrollmentRoutes.js";
import timetableRoutes from "./routes/timetableRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import studentApiRoutes from "./routes/studentApiRoutes.js";
import facultyApiRoutes from "./routes/facultyApiRoutes.js";
import studentDeviceRoutes from "./routes/studentDeviceRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "SmartAttend Backend is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "SmartAttend Backend is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    databaseConfigured: Boolean(process.env.DATABASE_URL),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "SmartAttend API is healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    databaseConfigured: Boolean(process.env.DATABASE_URL),
  });
});

app.use("/api/departments", departmentRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentApiRoutes);
app.use("/api/student", studentDeviceRoutes);
app.use("/api/faculty", facultyApiRoutes);

export default app;

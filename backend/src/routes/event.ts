import express from "express";
import {
  getStudentEvents,
  getStudentEvent,
  getAdminEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventStatistics,
  getUpcomingEvents,
  removeEventAttachment,
} from "../controllers/eventController.js";
import { auth, authorize } from "../middleware/auth.js";
import { upload } from "../utils/cloudinary.js";

const router = express.Router();

// Public/Common routes
router.get("/upcoming", auth, getUpcomingEvents);

// Student routes
router.get("/student", auth, authorize("student"), getStudentEvents);
router.get("/student/:id", auth, authorize("student"), getStudentEvent);

// Admin routes
router.get("/admin", auth, authorize("admin"), getAdminEvents);
router.get("/admin/statistics", auth, authorize("admin"), getEventStatistics);

router.post(
  "/admin",
  auth,
  authorize("admin"),
  upload.array("attachments", 5), // Allow up to 5 file attachments
  createEvent
);

router.put(
  "/admin/:id",
  auth,
  authorize("admin"),
  upload.array("attachments", 5),
  updateEvent
);

router.delete("/admin/:id", auth, authorize("admin"), deleteEvent);

router.delete(
  "/admin/:id/attachments/:attachmentIndex",
  auth,
  authorize("admin"),
  removeEventAttachment
);

export default router;

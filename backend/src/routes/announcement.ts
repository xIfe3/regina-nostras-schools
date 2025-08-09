import express from "express";
import {
  getPublicAnnouncements,
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAdminAnnouncements,
  getAnnouncementStatistics,
  toggleAnnouncementPin,
} from "../controllers/announcementController.js";
import { auth, authorize } from "../middleware/auth.js";
import { upload } from "../utils/cloudinary.js";

const router = express.Router();

// Public routes
router.get("/public", getPublicAnnouncements);

// Protected routes - require authentication
router.get("/", auth, getAnnouncements);

// Admin routes (must come before /:id route to avoid conflicts)
router.get(
  "/admin/statistics",
  auth,
  authorize("admin"),
  getAnnouncementStatistics
);
router.get("/admin", auth, authorize("admin"), getAdminAnnouncements);

router.post(
  "/admin",
  auth,
  authorize("admin"),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "attachments", maxCount: 5 },
  ]),
  createAnnouncement
);

router.put(
  "/admin/:id",
  auth,
  authorize("admin"),
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "attachments", maxCount: 5 },
  ]),
  updateAnnouncement
);

router.delete("/admin/:id", auth, authorize("admin"), deleteAnnouncement);
router.put("/admin/:id/pin", auth, authorize("admin"), toggleAnnouncementPin);

// Public single announcement route (must come after admin routes)
router.get("/:id", getAnnouncement);

export default router;

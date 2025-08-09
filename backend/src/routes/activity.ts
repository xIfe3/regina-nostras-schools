import express from "express";
import {
  getRecentActivities,
  getActivities,
  getActivityStats,
  getUserActivities,
  cleanupOldActivities,
} from "../controllers/activityController.js";
import { auth, authorize } from "../middleware/auth.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth, authorize("admin"));

// Activity routes
router.get("/recent", getRecentActivities);
router.get("/stats", getActivityStats);
router.get("/user/:userId", getUserActivities);
router.delete("/cleanup", cleanupOldActivities);
router.get("/", getActivities);

export default router;

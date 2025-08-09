import express from "express";
import {
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  updateProfileSettings,
  updateNotificationSettings,
  updateSecuritySettings,
} from "../controllers/studentController.js";
import { auth, authorize } from "../middleware/auth.js";
import { upload } from "../utils/cloudinary.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth, authorize("student"));

// Profile routes
router.route("/profile").get(getProfile).put(updateProfile);

router.post(
  "/profile/photo",
  upload.single("profilePhoto"),
  uploadProfilePhoto
);

// Settings routes
router.put("/settings/profile", updateProfileSettings);
router.put("/settings/notifications", updateNotificationSettings);
router.put("/settings/security", updateSecuritySettings);

export default router;

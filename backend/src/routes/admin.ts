import express from "express";
import {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkUploadResults,
  getPayments,
  verifyPayment,
  rejectPayment,
  getDashboardStats,
  getAdminProfile,
  updateAdminProfile,
  uploadAdminProfilePhoto,
  changeAdminPassword,
} from "../controllers/adminController.js";
import { auth, authorize } from "../middleware/auth.js";
import { upload } from "../utils/cloudinary.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth, authorize("admin"));

// Dashboard routes
router.get("/dashboard/stats", getDashboardStats);

// Student management routes
router
  .route("/students")
  .get(getStudents)
  .post(upload.single("profilePicture"), createStudent);

router
  .route("/students/:id")
  .get(getStudent)
  .put(upload.single("profileImage"), updateStudent)
  .delete(deleteStudent);

// Results management routes
router.post("/results/bulk-upload", bulkUploadResults);

// Payment management routes
router.get("/payments", getPayments);
router.put("/payments/:id/verify", verifyPayment);
router.put("/payments/:id/reject", rejectPayment);

// Admin profile management routes
router.get("/profile", getAdminProfile);
router.put("/profile", updateAdminProfile);
router.post("/profile/photo", upload.single("photo"), uploadAdminProfilePhoto);

// Admin password management
router.put("/password", changeAdminPassword);

export default router;

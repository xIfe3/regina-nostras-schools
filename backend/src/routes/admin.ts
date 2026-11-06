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
  getStudentParentAccount,
  createOrResendParentAccount,
  downloadStudentTemplate,
  bulkUploadStudents,
} from "../controllers/adminController.js";
import { auth, authorize } from "../middleware/auth.js";
import { upload } from "../utils/cloudinary.js";
import { localUpload } from "../utils/localUpload.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth, authorize("admin"));

// Dashboard routes
router.get("/dashboard/stats", getDashboardStats);

// Student management routes
// Bulk routes must come before /students/:id so "bulk-template" is not read as an id
router.get("/students/bulk-template", downloadStudentTemplate);
router.post(
  "/students/bulk-upload",
  localUpload.single("file"),
  bulkUploadStudents
);

router
  .route("/students")
  .get(getStudents)
  .post(upload.single("profilePicture"), createStudent);

router
  .route("/students/:id")
  .get(getStudent)
  .put(upload.single("profileImage"), updateStudent)
  .delete(deleteStudent);

router
  .route("/students/:id/parent-account")
  .get(getStudentParentAccount)
  .post(createOrResendParentAccount);

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

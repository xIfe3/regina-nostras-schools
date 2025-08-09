import express from "express";
import {
  getStudentPayments,
  submitPayment,
  getPayment,
  getAllPayments,
  verifyPayment,
  rejectPayment,
  getPaymentStatistics,
} from "../controllers/paymentController.js";
import { auth, authorize } from "../middleware/auth.js";
import { upload } from "../utils/cloudinary.js";

const router = express.Router();

// Student routes
router.get("/student", auth, authorize("student"), getStudentPayments);
router.post(
  "/",
  auth,
  authorize("student"),
  upload.single("receiptImage"),
  submitPayment
);
router.get("/student/:id", auth, authorize("student"), getPayment);

// Admin routes
router.get("/admin", auth, authorize("admin"), getAllPayments);
router.put("/:id/verify", auth, authorize("admin"), verifyPayment);
router.put("/:id/reject", auth, authorize("admin"), rejectPayment);
router.get("/statistics", auth, authorize("admin"), getPaymentStatistics);

export default router;

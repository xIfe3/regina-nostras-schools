import express from "express";
import {
  getStudentResults,
  getResult,
  getResults,
  createResult,
  updateResult,
  toggleResultPublication,
  deleteResult,
  getSessionsAndTerms,
  getResultStatistics,
  bulkUploadResults,
  downloadBulkTemplate,
  generateResultSheet,
  sendResultNotification,
} from "../controllers/resultController.js";
import { auth, authorize } from "../middleware/auth.js";
import { upload } from "../utils/cloudinary.js";
import { localUpload } from "../utils/localUpload.js";

const router = express.Router();

// Public routes (for both student and admin)
router.get("/sessions-terms", auth, getSessionsAndTerms);

// Student routes
router.get("/student", auth, authorize("student"), getStudentResults);
router.get("/student/:id", auth, authorize("student"), getResult);

// Admin routes - specific routes first, then general ones
router.get("/bulk-template", auth, authorize("admin"), downloadBulkTemplate);
router.post(
  "/bulk-upload",
  auth,
  authorize("admin"),
  localUpload.single("file"),
  bulkUploadResults
);
router.get("/statistics", auth, authorize("admin"), getResultStatistics);
router.post("/generate-sheet", auth, authorize("admin"), generateResultSheet);
router.post(
  "/send-notification",
  auth,
  authorize("admin"),
  sendResultNotification
);
router.put("/:id/publish", auth, authorize("admin"), toggleResultPublication);

router
  .route("/")
  .get(auth, authorize("admin"), getResults)
  .post(auth, authorize("admin"), createResult);

router
  .route("/:id")
  .put(auth, authorize("admin"), updateResult)
  .delete(auth, authorize("admin"), deleteResult);

export default router;

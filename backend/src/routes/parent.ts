import express from "express";
import {
  getParentProfile,
  updateParentProfile,
  getChildResults,
  getChildResult,
  getChildPayments,
  checkChildPayment,
  submitChildPayment,
} from "../controllers/parentController.js";
import { upload } from "../utils/storage.js";
import { auth, authorize } from "../middleware/auth.js";

const router = express.Router();

// All parent routes require a logged-in parent
router.use(auth, authorize("parent"));

router.route("/profile").get(getParentProfile).put(updateParentProfile);

router.get("/children/:studentId/results", getChildResults);
router.get("/children/:studentId/results/:resultId", getChildResult);
router.get("/children/:studentId/payments", getChildPayments);
router.get("/children/:studentId/payments/check", checkChildPayment);
router.post(
  "/children/:studentId/payments",
  upload.single("receiptImage"),
  submitChildPayment
);

export default router;

import express from "express";
import {
  getParentProfile,
  updateParentProfile,
  getChildResults,
  getChildResult,
  getChildPayments,
} from "../controllers/parentController.js";
import { auth, authorize } from "../middleware/auth.js";

const router = express.Router();

// All parent routes require a logged-in parent
router.use(auth, authorize("parent"));

router.route("/profile").get(getParentProfile).put(updateParentProfile);

router.get("/children/:studentId/results", getChildResults);
router.get("/children/:studentId/results/:resultId", getChildResult);
router.get("/children/:studentId/payments", getChildPayments);

export default router;

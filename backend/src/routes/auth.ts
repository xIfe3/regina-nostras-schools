import express from "express";
import {
  login,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:resettoken", resetPassword);

// Protected routes
router.get("/me", auth, getMe);
router.put("/change-password", auth, changePassword);

export default router;

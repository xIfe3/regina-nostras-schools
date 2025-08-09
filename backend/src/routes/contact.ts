import express from "express";
import { sendContactMessage } from "../controllers/contactController.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Rate limiting for contact form - 5 submissions per 15 minutes per IP
const contactRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message:
      "Too many contact form submissions. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// @route   POST /api/contact
// @desc    Send contact form message
// @access  Public
router.post("/", contactRateLimit, sendContactMessage);

export default router;

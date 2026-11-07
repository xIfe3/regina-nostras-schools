import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import "express-async-errors";

// Import routes
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import studentRoutes from "./routes/student";
import resultRoutes from "./routes/result";
import paymentRoutes from "./routes/payment";
import activityRoutes from "./routes/activity";
import eventRoutes from "./routes/event";
import contactRoutes from "./routes/contact";
import announcementRoutes from "./routes/announcement";
import parentRoutes from "./routes/parent";
import { settingsRouter, noticesRouter } from "./routes/settings";

// Import middleware
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Behind cPanel's LiteSpeed proxy: use X-Forwarded-For for the real client IP
app.set("trust proxy", 1);

// Security middleware
app.use(helmet());
app.use(
  cors({
    // FRONTEND_URL may hold several comma-separated origins (e.g. with and without www)
    origin: (process.env.FRONTEND_URL || "http://localhost:3000")
      .split(",")
      .map((url) => url.trim().replace(/\/$/, "")),
    credentials: true,
  })
);

// Rate limiting
// General API limit. A whole school (staff + students on the same Wi-Fi) shares one
// public IP, and each dashboard page makes several requests, so this must be generous.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX) || 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this network, please try again in a few minutes.",
  },
});
app.use("/api", limiter);

// Strict limit on password guessing: login / password reset attempts per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many sign-in attempts. Please wait 15 minutes and try again.",
  },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/reset-password", authLimiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Compression middleware
app.use(compression());

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/settings", settingsRouter);
app.use("/api/notices", noticesRouter);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI ||
        "mongodb://localhost:27017/regina-nostras-schools"
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
      );
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;

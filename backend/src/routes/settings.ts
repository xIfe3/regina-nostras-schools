import express from "express";
import {
  getPublicSettings,
  getAllSettings,
  updateSettings,
} from "../controllers/settingsController.js";
import {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  getActiveNotices,
  dismissNotice,
} from "../controllers/noticeController.js";
import { auth, authorize } from "../middleware/auth.js";

export const settingsRouter = express.Router();
settingsRouter.get("/public", getPublicSettings);
settingsRouter.get("/", auth, authorize("admin"), getAllSettings);
settingsRouter.put("/", auth, authorize("admin"), updateSettings);

export const noticesRouter = express.Router();
// Student/parent routes first so "active" is not read as an id
noticesRouter.get("/active", auth, authorize("student", "parent"), getActiveNotices);
noticesRouter.post("/:id/dismiss", auth, authorize("student", "parent"), dismissNotice);
noticesRouter
  .route("/")
  .get(auth, authorize("admin"), getNotices)
  .post(auth, authorize("admin"), createNotice);
noticesRouter
  .route("/:id")
  .put(auth, authorize("admin"), updateNotice)
  .delete(auth, authorize("admin"), deleteNotice);
